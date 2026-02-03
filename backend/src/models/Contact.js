import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        contactUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["pending", "accepted", "blocked"], default: "pending" },
        initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        nickname: { type: String, trim: true }
    },
    { timestamps: true }
);

contactSchema.index({ userId: 1, contactUserId: 1 }, { unique: true });

export default mongoose.model("Contact", contactSchema);
