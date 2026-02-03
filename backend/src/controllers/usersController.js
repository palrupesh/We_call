import { validationResult } from "express-validator";
import User from "../models/User.js";

export const getMe = async (req, res) => {
    res.json({ user: req.user });
};

export const updateMe = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const updates = {};
        const fields = ["displayName", "avatarUrl", "status"];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true
        }).select("-passwordHash");

        res.json({ user });
    } catch (error) {
        next(error);
    }
};

export const searchUsers = async (req, res, next) => {
    try {
        const query = (req.query.query || "").trim();
        const filter = query
            ? { $or: [{ username: new RegExp(query, "i") }, { email: new RegExp(query, "i") }] }
            : {};

        const users = await User.find(filter).select("-passwordHash").limit(20);
        res.json({ users });
    } catch (error) {
        next(error);
    }
};
