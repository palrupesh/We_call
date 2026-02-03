import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const payload = jwt.verify(token, env.jwtSecret);
        const user = await User.findById(payload.userId).select("-passwordHash");
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
