import { Server, Socket } from "socket.io";  // express

import { EMIT_SOCKET, SOCKET_NAMESPACES } from "../utils/constants";
import { registerUserSocket, removeUserSocket } from "../services/socketUserMap";
let initialized = false;

export function initializeSocket(io: Server) {
    if (initialized) return;
    initialized = true;
    // /user-agent-chat Namespace
    const userAgentChat = io.of(SOCKET_NAMESPACES.USER_AGENT_CHAT);
    const websiteAgentNsp = io.of(SOCKET_NAMESPACES.WEBSITE_AGENT_CHAT);

    userAgentChat.on("connection", (socket: Socket) => {
        console.log("[CHAT/NOTIFICATION] Socket connected:", socket.id);

        socket.on(EMIT_SOCKET.REGISTER_USER, (data: { userId: string }) => {
            console.log(`[CHAT] User registered: ${data.userId}`);
            registerUserSocket(data.userId, socket.id);
            socket.data.userId = data.userId;
        });

        socket.on("disconnect", (reason) => {
            console.log(`[CHAT] Socket disconnected: ${socket.id}`);
            console.log("Socket disconnected:", socket.id, "Reason:", reason);
            removeUserSocket(socket.data.userId);
        });
    });

    // Add other name spaces...
}