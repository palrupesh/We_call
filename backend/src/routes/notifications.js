import express from "express";
import {
    listNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notificationsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:id/read", requireAuth, markAsRead);
router.patch("/read-all", requireAuth, markAllAsRead);
router.delete("/:id", requireAuth, deleteNotification);

export default router;
