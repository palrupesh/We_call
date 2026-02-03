import Notification from "../models/Notification.js";

export const listNotifications = async (req, res, next) => {
    try {
        const unreadOnly = req.query.unread === "true";
        const filter = { userId: req.user._id };
        if (unreadOnly) {
            filter.read = false;
        }

        const notifications = await Notification.find(filter)
            .populate("fromUserId", "username displayName avatarUrl")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ notifications });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({ _id: id, userId: req.user._id });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        notification.read = true;
        await notification.save();

        res.json({ notification });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOne({ _id: id, userId: req.user._id });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        await Notification.deleteOne({ _id: id });
        res.json({ message: "Notification deleted" });
    } catch (error) {
        next(error);
    }
};
