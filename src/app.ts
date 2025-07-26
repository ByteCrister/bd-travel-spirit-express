// src/server.ts
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";

import "dotenv/config";            // loads .env in dev
import { initializeSocket } from "./controllers/socketController";
import { setIOInstance } from "./socket/setIOInstance";

import { connectDB, disconnectDB } from "./config/db";
import { env } from "./config/env";
import logger from "./config/logger";
import triggerUserAgentEventRouter from "./routes/trigger-socket-event.route";
import socketUserMapRouter from "./routes/socketUserMap.route";

async function bootstrap() {
    // Connect to MongoDB
    await connectDB();


    // Initialize Express + HTTP server
    const app = express();
    const server = http.createServer(app);

    // Global Middlewares
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));
    app.use(helmet());

    app.use(
        cors({
            origin: env.CLIENT_ORIGIN,
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-cron-secret"],
            credentials: true,
        })
    );

    // Socket.io Setup
    const io = new SocketIOServer(server, {
        path: env.SOCKET_PATH,
        pingInterval: 10000,
        pingTimeout: 20000,
        cors: {
            origin: env.CLIENT_ORIGIN,
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-cron-secret"],
            credentials: true,
        },
    });

    setIOInstance(io);
    initializeSocket(io);

    // Routes
    app.get("/", (_req, res) => {
        res.send("Express server running.");
    });

    app.use("/api", triggerUserAgentEventRouter);
    app.use("/api", socketUserMapRouter);

    // Health Check
    app.get("/health", (_req, res) => {
        const state = process.env.NODE_ENV === "production"
            ? io.engine.clientsCount > 0
                ? "ok"
                : "idle"
            : "dev";
        res.json({ status: state });
    });

    // Start Listening
    server.listen(env.PORT, () => {
        logger.info(`Server ▶ Listening on port ${env.PORT}`);
    });

    // Graceful Shutdown
    const shutdown = async () => {
        logger.info("Server ▶ Shutdown initiated");
        await disconnectDB();
        server.close(() => {
            logger.info("Server ▶ HTTP server closed");
            process.exit(0);
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
    logger.error("Server ▶ Failed to bootstrap:", err);
    process.exit(1);
});