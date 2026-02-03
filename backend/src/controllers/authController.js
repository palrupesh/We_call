import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { username, email, password, displayName } = req.body;
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(409).json({ message: "User already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ username, email, passwordHash, displayName });
        const token = signToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = signToken(user._id);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

export const me = async (req, res) => {
    res.json({ user: req.user });
};

export const logout = async (req, res) => {
    res.json({ message: "Logged out" });
};
