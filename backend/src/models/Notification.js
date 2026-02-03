import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: { type: String, enum: ["contact_request", "contact_accepted", "missed_call", "system"], required: true },
        fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        data: { type: mongoose.Schema.Types.Mixed }
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
