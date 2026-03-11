// G:\Projects\bd-travel-spirit-express\src\controllers\socketController.ts
import { Server, Socket } from "socket.io";  // express

import { EMIT_SOCKET, SOCKET_NAMESPACES } from "../utils/constants";
import { registerUserSocket, removeUserSocket } from "../services/socketUserMap";
let initialized = false;

export function initializeSocket(io: Server) {
    if (initialized) return;
    initialized = true;
    // /user-chat Namespace
    const USER_CHAT = io.of(SOCKET_NAMESPACES.USER_CHAT);

    USER_CHAT.on("connection", (socket: Socket) => {
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