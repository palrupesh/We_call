import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
    {
        callId: { type: String, required: true, index: true },
        caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        callee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["audio", "video"], required: true },
        status: { type: String, enum: ["ongoing", "ended", "missed", "declined"], default: "ongoing" },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date }
    },
    { timestamps: true }
);

export default mongoose.model("CallLog", callLogSchema);
