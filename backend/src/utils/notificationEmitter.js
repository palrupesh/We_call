import Notification from "../models/Notification.js";

/**
 * Emit notification to all of a user's connected socket sessions
 * @param {Object} io - Socket.io instance
 * @param {Map} onlineUsers - Map of userId -> Set<socketId>
 * @param {string} userId - Recipient user ID
 * @param {Object} notification - Notification object to emit
 */
export async function emitNotification(io, onlineUsers, userId, notification) {
  try {
    // Get all socket IDs for this user (supports multiple devices)
    const socketIds = onlineUsers.get(userId.toString());

    if (socketIds && socketIds.size > 0) {
      console.log(`📤 Emitting notification to ${socketIds.size} socket(s) for user ${userId}`);

      // Emit to each of the user's connected sockets
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("notification:new", notification);
      });

      return true;
    } else {
      console.log(`📵 User ${userId} is offline, notification stored in DB only`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error emitting notification:", error);
    return false;
  }
}

/**
 * Create notification in database and emit to user in real-time
 * @param {Object} io - Socket.io instance
 * @param {Map} onlineUsers - Map of userId -> Set<socketId>
 * @param {Object} notificationData - Notification data to create
 * @returns {Promise<Object>} Created notification
 */
export async function createAndEmitNotification(io, onlineUsers, notificationData) {
  try {
    // Create notification in database
    const notification = await Notification.create(notificationData);

    // Populate fromUserId with user details for real-time display
    await notification.populate("fromUserId", "username displayName avatarUrl");

    console.log(`✅ Created notification ${notification._id} for user ${notification.userId}`);

    // Emit to user if online
    if (io && onlineUsers) {
      await emitNotification(io, onlineUsers, notification.userId, notification);
    }

    return notification;
  } catch (error) {
    console.error("❌ Error creating and emitting notification:", error);
    throw error;
  }
}
