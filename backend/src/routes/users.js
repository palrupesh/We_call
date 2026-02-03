import express from "express";
import { body } from "express-validator";
import { getMe, updateMe, searchUsers } from "../controllers/usersController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, getMe);

router.patch(
    "/me",
    requireAuth,
    [
        body("displayName").optional().isLength({ min: 2 }),
        body("avatarUrl").optional().isURL(),
        body("status").optional().isLength({ min: 1, max: 140 })
    ],
    updateMe
);

router.get("/", requireAuth, searchUsers);

export default router;
