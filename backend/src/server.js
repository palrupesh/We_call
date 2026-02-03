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
        credentials: true,
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6
});

setupSocket(io);

const start = async () => {
    await connectDb();
    server.listen(env.port, () => {
        console.log(`🚀 Server running on port ${env.port}`);
        console.log(`📡 CORS Origin: ${env.corsOrigin}`);
        console.log(`🌍 Node Env: ${env.nodeEnv}`);
    });
};

start();
