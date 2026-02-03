import { validationResult } from "express-validator";
import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

export const listContacts = async (req, res, next) => {
    try {
        const status = req.query.status || "accepted";
        const contacts = await Contact.find({ userId: req.user._id, status })
            .populate("contactUserId", "username displayName avatarUrl status")
            .sort({ createdAt: -1 });

        res.json({ contacts });
    } catch (error) {
        next(error);
    }
};

export const sendContactRequest = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { contactUserId } = req.body;
        if (contactUserId === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot add yourself" });
        }

        const targetUser = await User.findById(contactUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if request already exists in either direction
        const existing = await Contact.findOne({
            $or: [
                { userId: req.user._id, contactUserId, status: "pending" },
                { userId: contactUserId, contactUserId: req.user._id, status: "pending" }
            ]
        });

        if (existing) {
            return res.status(409).json({ message: "Contact request already exists" });
        }

        // Only create contact from sender's perspective - status is pending
        const contact = await Contact.create({
            userId: req.user._id,
            contactUserId,
            status: "pending",
            initiatedBy: req.user._id
        });

        // Send notification to receiver with sender's contact ID
        await Notification.create({
            userId: contactUserId,
            type: "contact_request",
            fromUserId: req.user._id,
            message: `${req.user.displayName || req.user.username} sent you a contact request`,
            data: { contactId: contact._id }
        });

        res.status(201).json({ contact });
    } catch (error) {
        next(error);
    }
};

export const acceptContactRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find the pending request WHERE CURRENT USER IS THE RECEIVER
        // This means the contact was sent BY someone ELSE (userId) TO current user (contactUserId)
        const contact = await Contact.findOne({
            _id: id,
            contactUserId: req.user._id,
            status: "pending"
        });

        if (!contact) {
            return res.status(404).json({ message: "Contact request not found" });
        }

        // Update sender's contact to accepted
        contact.status = "accepted";
        await contact.save();

        // Create mutual contact for receiver as accepted
        const reverseContact = await Contact.create({
            userId: req.user._id,
            contactUserId: contact.userId,
            status: "accepted",
            initiatedBy: contact.initiatedBy
        });

        // Notify sender that request was accepted
        await Notification.create({
            userId: contact.userId,
            type: "contact_accepted",
            fromUserId: req.user._id,
            message: `${req.user.displayName || req.user.username} accepted your contact request`
        });

        // Mark receiver's request notification as accepted/read
        await Notification.updateMany(
            {
                userId: req.user._id,
                type: "contact_request",
                "data.contactId": contact._id
            },
            {
                $set: {
                    read: true,
                    "data.accepted": true
                }
            }
        );

        res.json({ contact });
    } catch (error) {
        next(error);
    }
};

export const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findOne({ _id: id, userId: req.user._id });

        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        await Contact.deleteOne({ _id: id });
        await Contact.deleteOne({ userId: contact.contactUserId, contactUserId: req.user._id });

        res.json({ message: "Contact deleted" });
    } catch (error) {
        next(error);
    }
};

export const blockContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findOne({ _id: id, userId: req.user._id });

        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        contact.status = "blocked";
        await contact.save();

        res.json({ contact });
    } catch (error) {
        next(error);
    }
};
