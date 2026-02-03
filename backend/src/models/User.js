import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        displayName: { type: String, trim: true },
        avatarUrl: { type: String, trim: true },
        status: { type: String, default: "Hey there! I am using WeCall." }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
