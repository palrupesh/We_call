/**
 * Socket.io instance singleton
 * Provides access to io and onlineUsers across the application
 * without circular dependencies
 */

let io = null;
let onlineUsers = null;

/**
 * Set the Socket.io instance and onlineUsers Map
 * Called once during server initialization
 */
export const setSocketInstance = (ioInstance, onlineUsersMap) => {
  io = ioInstance;
  onlineUsers = onlineUsersMap;
  console.log("✅ Socket instance set successfully");
};

/**
 * Get the Socket.io instance and onlineUsers Map
 * Used by controllers to access socket functionality
 */
export const getSocketInstance = () => {
  if (!io || !onlineUsers) {
    console.warn("⚠️ Socket instance not yet initialized");
  }
  return { io, onlineUsers };
};
