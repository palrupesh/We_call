import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import env from "../config/env.js";
import CallLog from "../models/CallLog.js";

const setupSocket = (io) => {
    const onlineUsers = new Map(); // userId -> Set<socketId>
    const activeCalls = new Map(); // Track active calls: callId -> { caller, callee }

    io.on("connection", (socket) => {
        console.log("🔌 New socket connection:", socket.id);

        socket.on("auth", async ({ token }) => {
            try {
                const payload = jwt.verify(token, env.jwtSecret);
                socket.userId = payload.userId;

                // Add socket ID to user's Set (create if doesn't exist)
                if (!onlineUsers.has(socket.userId)) {
                    onlineUsers.set(socket.userId, new Set());
                }
                onlineUsers.get(socket.userId).add(socket.id);

                socket.emit("auth:ok", { userId: socket.userId });
                console.log(`✅ User authenticated: ${socket.userId}, Socket: ${socket.id}, Total sockets: ${onlineUsers.get(socket.userId).size}`);

                io.emit("user:online", { userId: socket.userId });
            } catch (error) {
                console.error("❌ Auth error:", error.message);
                socket.emit("auth:error", { message: "Invalid token" });
            }
        });

        socket.on("call:initiate", async ({ toUserId, type, offer }) => {
            if (!socket.userId) {
                return socket.emit("call:error", { message: "Unauthorized" });
            }

            console.log(`📞 Call initiate: ${socket.userId} -> ${toUserId} (${type})`);

            // Check if target user is already in a call
            const userIsInCall = Array.from(activeCalls.values()).some(
                (call) => call.callee === toUserId || call.caller === toUserId
            );

            if (userIsInCall) {
                console.log(`⛔ User ${toUserId} is busy`);
                return socket.emit("call:busy", { toUserId });
            }

            const targetSocketIds = onlineUsers.get(toUserId);
            const callId = nanoid(12);

            // Check if user is online
            const isOnline = targetSocketIds && targetSocketIds.size > 0;

            await CallLog.create({
                callId,
                caller: socket.userId,
                callee: toUserId,
                type,
                status: isOnline ? "ongoing" : "missed",
                startedAt: new Date()
            });

            if (!isOnline) {
                console.log(`👤 User ${toUserId} is offline`);
                return socket.emit("call:unavailable", { callId, toUserId });
            }

            // Track the active call
            activeCalls.set(callId, { caller: socket.userId, callee: toUserId });
            console.log(`✅ Call tracked: ${callId}`);

            // Emit to ALL socket IDs for the target user
            targetSocketIds.forEach((socketId) => {
                io.to(socketId).emit("call:incoming", {
                    callId,
                    fromUserId: socket.userId,
                    type,
                    offer
                });
            });
            console.log(`📤 call:incoming sent to ${toUserId} (${targetSocketIds.size} socket(s))`);
        });

        socket.on("call:answer", ({ callId, toUserId, answer }) => {
            console.log(`✅ Call answer: ${socket.userId} -> ${toUserId}`);
            const targetSocketIds = onlineUsers.get(toUserId);
            if (!targetSocketIds || targetSocketIds.size === 0) {
                console.log(`👤 Target user ${toUserId} not found`);
                return socket.emit("call:unavailable", { callId, toUserId });
            }

            // Emit to ALL socket IDs for the target user
            targetSocketIds.forEach((socketId) => {
                io.to(socketId).emit("call:answer", { callId, answer, fromUserId: socket.userId });
            });
            console.log(`📤 call:answer sent to ${toUserId} (${targetSocketIds.size} socket(s))`);
        });

        socket.on("call:ice", ({ callId, toUserId, candidate }) => {
            const targetSocketIds = onlineUsers.get(toUserId);
            if (!targetSocketIds || targetSocketIds.size === 0) {
                return;
            }

            // Emit to ALL socket IDs for the target user
            targetSocketIds.forEach((socketId) => {
                io.to(socketId).emit("call:ice", { callId, candidate, fromUserId: socket.userId });
            });
            console.log(`❄️ ICE candidate forwarded: ${socket.userId} -> ${toUserId} (${targetSocketIds.size} socket(s))`);
        });

        socket.on("call:hangup", async ({ callId, toUserId }) => {
            const targetSocketIds = onlineUsers.get(toUserId);
            if (targetSocketIds && targetSocketIds.size > 0) {
                // Emit to ALL socket IDs for the target user
                targetSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("call:hangup", { callId, fromUserId: socket.userId });
                });
            }

            // Remove from active calls
            activeCalls.delete(callId);

            await CallLog.findOneAndUpdate(
                { callId },
                { status: "ended", endedAt: new Date() },
                { new: true }
            );
        });

        socket.on("call:decline", async ({ callId, toUserId }) => {
            const targetSocketIds = onlineUsers.get(toUserId);
            if (targetSocketIds && targetSocketIds.size > 0) {
                // Emit to ALL socket IDs for the target user
                targetSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("call:declined", { callId, fromUserId: socket.userId });
                });
            }

            // Remove from active calls
            activeCalls.delete(callId);

            await CallLog.findOneAndUpdate(
                { callId },
                { status: "declined", endedAt: new Date() },
                { new: true }
            );
        });

        socket.on("presence:check", ({ userIds }) => {
            const presence = {};
            userIds.forEach((uid) => {
                presence[uid] = onlineUsers.has(uid);
            });
            socket.emit("presence:status", { presence });
        });

        socket.on("disconnect", () => {
            if (socket.userId) {
                // Find and end any active calls involving this user
                for (const [callId, callData] of activeCalls.entries()) {
                    if (callData.caller === socket.userId || callData.callee === socket.userId) {
                        const otherUserId = callData.caller === socket.userId ? callData.callee : callData.caller;
                        const otherSocketIds = onlineUsers.get(otherUserId);

                        if (otherSocketIds && otherSocketIds.size > 0) {
                            // Emit to ALL socket IDs for the other user
                            otherSocketIds.forEach((socketId) => {
                                io.to(socketId).emit("call:hangup", { callId, fromUserId: socket.userId });
                            });
                        }

                        // Update call log
                        CallLog.findOneAndUpdate(
                            { callId },
                            { status: "ended", endedAt: new Date() },
                            { new: true }
                        ).catch(console.error);

                        activeCalls.delete(callId);
                    }
                }

                // Remove this socket ID from the user's Set
                const userSockets = onlineUsers.get(socket.userId);
                if (userSockets) {
                    userSockets.delete(socket.id);
                    console.log(`🔌 Socket disconnected: ${socket.id}, Remaining sockets: ${userSockets.size}`);

                    // If no more sockets for this user, delete the user and emit offline
                    if (userSockets.size === 0) {
                        onlineUsers.delete(socket.userId);
                        io.emit("user:offline", { userId: socket.userId });
                        console.log(`👤 User offline: ${socket.userId}`);
                    }
                }
            }
        });
    });
};

export default setupSocket;
