import { validationResult } from "express-validator";
import CallLog from "../models/CallLog.js";

export const listCalls = async (req, res, next) => {
    try {
        const filter = {
            $or: [{ caller: req.user._id }, { callee: req.user._id }]
        };

        if (req.query.type && ["audio", "video"].includes(req.query.type)) {
            filter.type = req.query.type;
        }

        if (req.query.status && ["ongoing", "ended", "missed", "declined"].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        if (req.query.startDate || req.query.endDate) {
            filter.startedAt = {};
            if (req.query.startDate) {
                filter.startedAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.startedAt.$lte = new Date(req.query.endDate);
            }
        }

        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const calls = await CallLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate("caller", "username displayName avatarUrl")
            .populate("callee", "username displayName avatarUrl");

        const total = await CallLog.countDocuments(filter);

        res.json({ calls, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
};

export const createCall = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { callId, calleeId, type } = req.body;

        if (calleeId === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot call yourself" });
        }

        const call = await CallLog.create({
            callId,
            caller: req.user._id,
            callee: calleeId,
            type,
            status: "ongoing",
            startedAt: new Date()
        });

        res.status(201).json({ call });
    } catch (error) {
        next(error);
    }
};

export const endCall = async (req, res, next) => {
    try {
        const { id } = req.params;
        let call;

        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            call = await CallLog.findById(id);
        }

        if (!call) {
            call = await CallLog.findOne({ callId: id });
        }

        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }

        if (
            call.caller.toString() !== req.user._id.toString() &&
            call.callee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        call.status = "ended";
        call.endedAt = new Date();
        await call.save();

        res.json({ call });
    } catch (error) {
        next(error);
    }
};
