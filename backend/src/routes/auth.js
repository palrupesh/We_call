import express from "express";
import { body } from "express-validator";
import { register, login, me, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post(
    "/register",
    [
        body("username").isLength({ min: 3 }).trim(),
        body("email").isEmail().normalizeEmail(),
        body("password").isLength({ min: 6 }),
        body("displayName").optional().isLength({ min: 2 })
    ],
    register
);

router.post(
    "/login",
    [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 6 })],
    login
);

router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

export default router;
