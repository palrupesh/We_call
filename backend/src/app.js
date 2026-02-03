import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import { notFound, errorHandler } from "./middleware/error.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import callsRoutes from "./routes/calls.js";
import contactsRoutes from "./routes/contacts.js";
import notificationsRoutes from "./routes/notifications.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
});

app.use("/api", apiLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/calls", callsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
