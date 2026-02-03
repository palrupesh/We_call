import express from "express";
import { body } from "express-validator";
import { listCalls, createCall, endCall } from "../controllers/callsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listCalls);

router.post(
    "/",
    requireAuth,
    [
        body("callId").isString().isLength({ min: 6 }),
        body("calleeId").isMongoId(),
        body("type").isIn(["audio", "video"])
    ],
    createCall
);

router.patch("/:id/end", requireAuth, endCall);

export default router;
