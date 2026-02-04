import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api, { setAuthToken, setLogoutCallback } from "./api";
import Header from "./components/Header";
import AuthForm from "./components/AuthForm";
import SearchUsers from "./components/SearchUsers";
import Contacts from "./components/Contacts";
import Notifications from "./components/Notifications";
import CallHistory from "./components/CallHistory";
import LiveCall from "./components/LiveCall";
import AlertBox from "./components/AlertBox";
import CallDeclined from "./components/CallDeclined";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("wecall_token") || "");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calls, setCalls] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDeclined, setCallDeclined] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("search");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifClosing, setNotifClosing] = useState(false);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  // chagnes for handling race around condition
  const pendingCandidatesRef = useRef([]);

  const localStreamRef = useRef(null);
  const notifTimerRef = useRef(null);

  const isAuthed = useMemo(() => Boolean(token), [token]);

  // Register logout callback for API interceptor
  useEffect(() => {
    setLogoutCallback(() => {
      setToken("");
      setError("Your session has expired. Please login again.");
    });
  }, []);

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem("wecall_token", token);
      initSocket(token);
      fetchBootstrap();
    } else {
      localStorage.removeItem("wecall_token");
      setUser(null);
      cleanupCall();
      disconnectSocket();
    }
  }, [token]);

  const initSocket = (jwtToken) => {
    if (socketRef.current) {
      return;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("auth", { token: jwtToken });
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setError("Failed to connect to server. Please check your connection.");
    });

    socket.on("disconnect", () => {
      console.log("⚠️ Socket disconnected");
    });

    socket.on("auth:error", () => {
      setError("Socket authentication failed. Please login again.");
      setToken(""); // Logout user on socket auth failure
    });

    socket.on("call:incoming", (payload) => {
      setIncomingCall(payload);
    });

    // socket.on("call:answer", async ({ answer }) => {
    //   if (pcRef.current && answer) {
    //     await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    //   }
    // });

    // socket.on("call:ice", async ({ candidate }) => {
    //   if (pcRef.current && candidate) {
    //     try {
    //       await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    //     } catch (err) {
    //       console.error(err);
    //     }
    //   }
    // });



    // changes to solve race around condition

    socket.on("call:answer", async ({ answer }) => {
      if (pcRef.current && answer) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        // Flush queued ICE
        for (const candidate of pendingCandidatesRef.current) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
        pendingCandidatesRef.current = [];
        console.log("✅ Flushed queued ICE candidates");
      }
    });


    socket.on("call:ice", async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;

      try {
        if (pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
          console.log("✅ ICE candidate added");
        } else {
          console.log("⏳ Queuing ICE candidate");
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error("Error adding ICE:", err);
      }
    });


    socket.on("call:hangup", () => {
      cleanupCall();
    });

    socket.on("call:declined", () => {
      cleanupCall();
      setCallDeclined({ reason: "declined", message: "Call declined by user" });
    });

    socket.on("call:busy", () => {
      cleanupCall();
      setCallDeclined({ reason: "busy", message: "User is busy on another call" });
    });
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const fetchBootstrap = async () => {
    try {
      const [meRes, contactsRes, notificationsRes, callsRes] = await Promise.all([
        api.get("/api/users/me"),
        api.get("/api/contacts?status=accepted"),
        api.get("/api/notifications"),
        api.get("/api/calls")
      ]);

      setUser(meRes.data.user);
      setContacts(contactsRes.data.contacts || []);
      setNotifications(notificationsRes.data.notifications || []);
      setCalls(callsRes.data.calls || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load data");
    }
  };

  const handleAuthSubmit = async (mode, form) => {
    setLoading(true);
    setError("");

    try {
      const payload = {
        email: form.email,
        password: form.password
      };

      if (mode === "register") {
        payload.username = form.username;
        payload.displayName = form.displayName || form.username;
      }

      const response = await api.post(`/api/auth/${mode}`, payload);
      setToken(response.data.token);
    } catch (err) {
      setError(err?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await api.get(`/api/users?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Search failed");
    }
  };

  const sendContactRequest = async (contactUserId) => {
    try {
      await api.post("/api/contacts", { contactUserId });
      setSearchResults((prev) => prev.filter((u) => u._id !== contactUserId));
      fetchBootstrap();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send request");
    }
  };

  const acceptContactRequest = async (contactId) => {
    if (!contactId) return;
    try {
      await api.patch(`/api/contacts/${contactId}/accept`);
      fetchBootstrap();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to accept request");
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      fetchBootstrap();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark read");
    }
  };

  const endCallLog = async (callId) => {
    try {
      await api.patch(`/api/calls/${callId}/end`);
      fetchBootstrap();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to end call log");
    }
  };

  // const createPeerConnection = (toUserId) => {
  //   const pc = new RTCPeerConnection({
  //     iceServers: [
  //       { urls: "stun:stun.l.google.com:19302" },
  //       { urls: "stun:stun1.l.google.com:19302" },
  //       // Free TURN server for production fallback
  //       {
  //         urls: "turn:openrelay.metered.ca:80",
  //         username: "openrelayproject",
  //         credential: "openrelayproject"
  //       },
  //       {
  //         urls: "turn:openrelay.metered.ca:443",
  //         username: "openrelayproject",
  //         credential: "openrelayproject"
  //       }
  //     ]
  //   });

  // changes made here

  const createPeerConnection = (toUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "72d777e8a3d3b5418329b5e7",
          credential: "gapfKSoKbkVyd/5e",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "72d777e8a3d3b5418329b5e7",
          credential: "gapfKSoKbkVyd/5e",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "72d777e8a3d3b5418329b5e7",
          credential: "gapfKSoKbkVyd/5e",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "72d777e8a3d3b5418329b5e7",
          credential: "gapfKSoKbkVyd/5e",
        },
      ],
    });

    // end changes here


    pc.onicecandidate = (event) => {

      // chagnes made here
      if (event.candidate) {
        console.log("Candidate type:", event.candidate.type);
        console.log("Full candidate:", event.candidate.candidate);
      }
      //end changes here 


      if (event.candidate && socketRef.current) {
        socketRef.current.emit("call:ice", {
          toUserId,
          candidate: event.candidate,
          callId: activeCall?.callId
        });
        console.log("📤 ICE Candidate sent:", event.candidate.candidate);
      }
    };


    pc.ontrack = (event) => {
      console.log("📥 Remote track received:", event.track.kind);
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStream(remoteStream);
        console.log("✅ Remote stream set:", remoteStream.id);
      }
    };

    // Detect when peer connection is closed or fails
    pc.onconnectionstatechange = () => {
      console.log("🔗 Connection state:", pc.connectionState);
      console.log(`   🔍 ICE Connection: ${pc.iceConnectionState}, ICE Gathering: ${pc.iceGatheringState}, Signaling: ${pc.signalingState}`);
      if (pc.connectionState === "failed") {
        console.error("❌ PEER CONNECTION FAILED - Candidates may not be connecting");
        setError("Connection failed: Could not establish peer connection. Check network/TURN server.");
      } else if (pc.connectionState === "closed") {
        cleanupCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`❄️ ICE Connection state: ${pc.iceConnectionState}`);
      
      if (pc.iceConnectionState === "failed") {
        console.error("❌ ICE FAILED - Checking candidate types...");
        console.error("   Sender candidates:", pc.getStats());
      } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log("✅ ICE CONNECTION ESTABLISHED");
      } else if (pc.iceConnectionState === "disconnected") {
        console.warn("⚠️ ICE Disconnected - may reconnect...");
      } else if (pc.iceConnectionState === "closed") {
        cleanupCall();
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`🧊 ICE Gathering state: ${pc.iceGatheringState}`);
      if (pc.iceGatheringState === "complete") {
        console.log("✅ All ICE candidates gathered");
        // Optionally log candidate stats
        pc.getStats().then(stats => {
          stats.forEach(report => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              console.log(`   ✅ Active candidate pair: ${report.availableOutgoingBitrate} bps`);
            }
          });
        });
      }
    };

    return pc;
  };

  const startLiveCall = async (toUserId, type) => {
    if (!socketRef.current) {
      setError("Socket not connected yet.");
      return;
    }

    try {
      console.log("📞 Starting call to:", toUserId, "Type:", type);

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: type === "video" ? { width: 640, height: 480 } : false,
          audio: true
        });

        localStreamRef.current = media;
        setLocalStream(media);
        console.log("🎥 Local stream acquired:", media.id);

        const pc = createPeerConnection(toUserId);
        pcRef.current = pc;

        media.getTracks().forEach((track) => {
          pc.addTrack(track, media);
          console.log("📤 Track added:", track.kind);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("📋 Offer created");

        setActiveCall({ toUserId, type, callId: null });
        socketRef.current.emit("call:initiate", { toUserId, type, offer });
      } catch (mediaErr) {
        // Handle getUserMedia specific errors
        if (mediaErr.name === "NotAllowedError") {
          throw new Error("Camera/microphone permission denied. Please check browser permissions.");
        } else if (mediaErr.name === "NotFoundError") {
          throw new Error("No camera/microphone found on this device.");
        } else if (mediaErr.name === "NotReadableError") {
          throw new Error("Camera/microphone is already in use by another application.");
        } else {
          throw mediaErr;
        }
      }
    } catch (err) {
      console.error("❌ Call start error:", err);
      setError("Failed to start call: " + (err.message || "Unknown error"));
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall || !socketRef.current) return;

    try {
      console.log("✅ Accepting call from:", incomingCall.fromUserId, "Type:", incomingCall.type);

      try {
        const media = await navigator.mediaDevices.getUserMedia({
          video: incomingCall.type === "video" ? { width: 640, height: 480 } : false,
          audio: true
        });

        localStreamRef.current = media;
        setLocalStream(media);
        console.log("🎥 Local stream acquired:", media.id);

        const pc = createPeerConnection(incomingCall.fromUserId);
        pcRef.current = pc;

        media.getTracks().forEach((track) => {
          pc.addTrack(track, media);
          console.log("📤 Track added:", track.kind);
        });

        console.log("📋 Setting remote description...");
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
        // 🔥 Flush queued ICE
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];
        console.log("✅ Flushed queued ICE candidates");


        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("📋 Answer created");

        socketRef.current.emit("call:answer", {
          callId: incomingCall.callId,
          toUserId: incomingCall.fromUserId,
          answer
        });

        setActiveCall({ toUserId: incomingCall.fromUserId, type: incomingCall.type, callId: incomingCall.callId });
        setIncomingCall(null);
      } catch (mediaErr) {
        // Handle getUserMedia specific errors
        if (mediaErr.name === "NotAllowedError") {
          throw new Error("Camera/microphone permission denied. Please check browser permissions.");
        } else if (mediaErr.name === "NotFoundError") {
          throw new Error("No camera/microphone found on this device.");
        } else if (mediaErr.name === "NotReadableError") {
          throw new Error("Camera/microphone is already in use by another application.");
        } else {
          throw mediaErr;
        }
      }
    } catch (err) {
      console.error("❌ Call accept error:", err);
      setError("Failed to accept call: " + (err.message || "Unknown error"));
    }
  };

  const declineIncomingCall = () => {
    if (!incomingCall || !socketRef.current) return;

    socketRef.current.emit("call:decline", {
      callId: incomingCall.callId,
      toUserId: incomingCall.fromUserId
    });

    setIncomingCall(null);
    setCallDeclined({ reason: "declined", message: "You declined the call" });
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setActiveCall(null);
  };

  const hangupCall = () => {
    if (socketRef.current && activeCall) {
      socketRef.current.emit("call:hangup", {
        callId: activeCall.callId,
        toUserId: activeCall.toUserId
      });
    }
    cleanupCall();
  };

  // const [callDeclined, setCallDeclined] = useState(false);

  return (
    <div className="app">
      <Header
        user={user}
        onLogout={handleLogout}
        notificationCount={notifications.filter((item) => !item.read).length}
        onToggleNotifications={() => {
          if (showNotifications) {
            if (notifTimerRef.current) {
              clearTimeout(notifTimerRef.current);
            }
            setNotifClosing(true);
            notifTimerRef.current = setTimeout(() => {
              setShowNotifications(false);
              setNotifClosing(false);
            }, 200);
          } else {
            setNotifClosing(false);
            setShowNotifications(true);
          }
        }}
      />

      <AlertBox message={error} />

      {!isAuthed ? (
        <AuthForm onSubmit={handleAuthSubmit} isLoading={loading} />
      ) : (
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-nav">
              <button
                className={`nav-btn ${sidebarTab === "search" ? "active" : ""}`}
                onClick={() => setSidebarTab("search")}
              >
                Search
              </button>
              <button
                className={`nav-btn ${sidebarTab === "contacts" ? "active" : ""}`}
                onClick={() => setSidebarTab("contacts")}
              >
                Contacts
              </button>
              <button
                className={`nav-btn ${sidebarTab === "history" ? "active" : ""}`}
                onClick={() => setSidebarTab("history")}
              >
                History
              </button>
            </div>

            <div className="sidebar-panel">
              {sidebarTab === "search" && (
                <SearchUsers
                  query={searchQuery}
                  results={searchResults}
                  onQueryChange={setSearchQuery}
                  onSearch={searchUsers}
                  onAddContact={sendContactRequest}
                />
              )}

              {sidebarTab === "contacts" && (
                <Contacts contacts={contacts} onStartCall={startLiveCall} />
              )}

              {sidebarTab === "history" && (
                <CallHistory calls={calls} onEndCall={endCallLog} />
              )}
            </div>
          </aside>

          <main className="main-content">
            {callDeclined && (
              <CallDeclined
                reason={callDeclined.reason}
                message={callDeclined.message}
                onDismiss={() => setCallDeclined(null)}
              />
            )}

            <LiveCall
              incomingCall={incomingCall}
              activeCall={activeCall}
              localStream={localStream}
              remoteStream={remoteStream}
              onAccept={acceptIncomingCall}
              onDecline={declineIncomingCall}
              onHangup={hangupCall}
            />
          </main>
        </div>
      )}

      {isAuthed && showNotifications && (
        <div
          className="notif-overlay"
          onClick={() => {
            if (notifTimerRef.current) {
              clearTimeout(notifTimerRef.current);
            }
            setNotifClosing(true);
            notifTimerRef.current = setTimeout(() => {
              setShowNotifications(false);
              setNotifClosing(false);
            }, 200);
          }}
        >
          <div
            className={`notif-panel ${notifClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notif-header">
              <h2>Notifications</h2>
              <button
                className="btn secondary"
                onClick={() => {
                  if (notifTimerRef.current) {
                    clearTimeout(notifTimerRef.current);
                  }
                  setNotifClosing(true);
                  notifTimerRef.current = setTimeout(() => {
                    setShowNotifications(false);
                    setNotifClosing(false);
                  }, 200);
                }}
              >
                Close
              </button>
            </div>
            <Notifications
              notifications={notifications}
              onAccept={acceptContactRequest}
              onMarkRead={markNotificationRead}
              hideTitle
            />
          </div>
        </div>
      )}
      {callDeclined && <CallDeclined onDismiss={() => setCallDeclined(false)} />}
    </div>
  );
}

export default App;
