import express from "express";
import { body } from "express-validator";
import {
    listContacts,
    sendContactRequest,
    acceptContactRequest,
    deleteContact,
    blockContact
} from "../controllers/contactsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listContacts);

router.post(
    "/",
    requireAuth,
    [body("contactUserId").isMongoId()],
    sendContactRequest
);

router.patch("/:id/accept", requireAuth, acceptContactRequest);
router.patch("/:id/block", requireAuth, blockContact);
router.delete("/:id", requireAuth, deleteContact);

export default router;
