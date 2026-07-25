import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { initializeSocket } from "../config/socketInitializer";
import { setIOInstance } from "./setIOInstance";
import { env } from "../config/env";

export let io: SocketIOServer;

export const initializeSocketServer = (server: http.Server) => {
    io = new SocketIOServer(server, {
        path: env.SOCKET_PATH,
        pingInterval: 10000,
        pingTimeout: 20000,
        cors: {
            origin: env.CLIENT_ORIGIN,      // string[] — supports multiple origins
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        },
    });

    setIOInstance(io); // Makes it available to triggerSocketEvent
    console.log("✅ Socket.IO initialized");

    initializeSocket(io); // handler with namespaces
};