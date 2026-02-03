import { useRef, useEffect, useState } from "react";
import loadingImg from "../assets/loading.svg";

function LiveCall({ incomingCall, activeCall, localStream, remoteStream, onAccept, onDecline, onHangup }) {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isCallConnecting, setIsCallConnecting] = useState(false);

    useEffect(() => {
        // Show connecting animation when activeCall is set but remoteStream not yet received
        if (activeCall && !remoteStream) {
            setIsCallConnecting(true);
        } else {
            setIsCallConnecting(false);
        }
    }, [activeCall, remoteStream]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (
        <section className="card call-panel">
            <h2>Live call</h2>
            {incomingCall ? (
                <div className="call-banner">
                    <div>
                        <strong>Incoming {incomingCall.type} call</strong>
                        <p className="muted">From user: {incomingCall.fromUserId}</p>
                    </div>
                    <div className="actions">
                        <button className="btn" onClick={onAccept}>
                            Accept
                        </button>
                        <button className="btn secondary" onClick={onDecline}>
                            Decline
                        </button>
                    </div>
                </div>
            ) : activeCall ? (
                <div className="call-banner">
                    <div>
                        <strong>Call in progress</strong>
                        <p className="muted">Type: {activeCall.type}</p>
                        {isCallConnecting && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <img src={loadingImg} alt="Connecting..." style={{ width: "16px", height: "16px" }} />
                                <span className="muted">Connecting...</span>
                            </div>
                        )}
                    </div>
                    <button className="btn danger" onClick={onHangup}>
                        Hang up
                    </button>
                </div>
            ) : (
                <p className="muted">No active calls.</p>
            )}
            <div className="video-grid">
                <video ref={localVideoRef} autoPlay playsInline muted className="video" />
                <video ref={remoteVideoRef} autoPlay playsInline className="video" />
            </div>
        </section>
    );
}

export default LiveCall;
