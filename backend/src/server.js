import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import env from "./config/env.js";
import connectDb from "./config/db.js";
import setupSocket from "./sockets/index.js";

dotenv.config();

const server = http.createServer(app);
const io = new (await import("socket.io")).Server(server, {
    cors: {
        origin: env.corsOrigin,
        credentials: true
    }
});

setupSocket(io);

const start = async () => {
    await connectDb();
    server.listen(env.port, () => {
        console.log(`Server running on port ${env.port}`);
    });
};

start();
