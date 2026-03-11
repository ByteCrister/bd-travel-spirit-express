import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";

import "dotenv/config";

import { env } from "./config/env";
import triggerUserAgentEventRouter from "./routes/trigger-socket-event.route";
import socketUserMapRouter from "./routes/socketUserMap.route";
import { initializeSocketServer } from "./socket/socket";

const app = express();
const server = http.createServer(app);

// Middlewares
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

// Initialize Socket.IO
initializeSocketServer(server);

// Routes
app.get("/", (_req, res) => {
    res.send("Express server running.");
});

app.use("/api", triggerUserAgentEventRouter);
app.use("/api", socketUserMapRouter);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

export { app, server };