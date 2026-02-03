import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import env from "../config/env.js";
import CallLog from "../models/CallLog.js";

const setupSocket = (io) => {
    const onlineUsers = new Map();
    const activeCalls = new Map(); // Track active calls: callId -> { caller, callee }

    io.on("connection", (socket) => {
        socket.on("auth", async ({ token }) => {
            try {
                const payload = jwt.verify(token, env.jwtSecret);
                socket.userId = payload.userId;
                onlineUsers.set(socket.userId, socket.id);
                socket.emit("auth:ok", { userId: socket.userId });

                io.emit("user:online", { userId: socket.userId });
            } catch (error) {
                socket.emit("auth:error", { message: "Invalid token" });
            }
        });

        socket.on("call:initiate", async ({ toUserId, type, offer }) => {
            if (!socket.userId) {
                return socket.emit("call:error", { message: "Unauthorized" });
            }

            // Check if target user is already in a call
            const userIsInCall = Array.from(activeCalls.values()).some(
                (call) => call.callee === toUserId || call.caller === toUserId
            );

            if (userIsInCall) {
                return socket.emit("call:busy", { toUserId });
            }

            const targetSocketId = onlineUsers.get(toUserId);
            const callId = nanoid(12);

            await CallLog.create({
                callId,
                caller: socket.userId,
                callee: toUserId,
                type,
                status: targetSocketId ? "ongoing" : "missed",
                startedAt: new Date()
            });

            if (!targetSocketId) {
                return socket.emit("call:unavailable", { callId, toUserId });
            }

            // Track the active call
            activeCalls.set(callId, { caller: socket.userId, callee: toUserId });

            io.to(targetSocketId).emit("call:incoming", {
                callId,
                fromUserId: socket.userId,
                type,
                offer
            });
        });

        socket.on("call:answer", ({ callId, toUserId, answer }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (!targetSocketId) {
                return socket.emit("call:unavailable", { callId, toUserId });
            }

            io.to(targetSocketId).emit("call:answer", { callId, answer, fromUserId: socket.userId });
        });

        socket.on("call:ice", ({ callId, toUserId, candidate }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (!targetSocketId) {
                return;
            }

            io.to(targetSocketId).emit("call:ice", { callId, candidate, fromUserId: socket.userId });
        });

        socket.on("call:hangup", async ({ callId, toUserId }) => {
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:hangup", { callId, fromUserId: socket.userId });
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
            const targetSocketId = onlineUsers.get(toUserId);
            if (targetSocketId) {
                io.to(targetSocketId).emit("call:declined", { callId, fromUserId: socket.userId });
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
                        const otherSocketId = onlineUsers.get(otherUserId);

                        if (otherSocketId) {
                            io.to(otherSocketId).emit("call:hangup", { callId, fromUserId: socket.userId });
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

                onlineUsers.delete(socket.userId);
                io.emit("user:offline", { userId: socket.userId });
            }
        });
    });
};

export default setupSocket;
