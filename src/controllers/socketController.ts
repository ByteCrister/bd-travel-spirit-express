// G:\Projects\bd-travel-spirit-express\src\controllers\socketController.ts
import { Server, Socket } from "socket.io";  // express

import { EMIT_SOCKET, SOCKET_NAMESPACES } from "../utils/constants";
import { registerUserSocket, removeUserSocket } from "../services/socketUserMap";
let initialized = false;

export function initializeSocket(io: Server) {
    if (initialized) return;
    initialized = true;
    // /user-online Namespace
    const USER_ONLINE = io.of(SOCKET_NAMESPACES.USER_ONLINE);

    USER_ONLINE.on("connection", (socket: Socket) => {
        console.log("[USER_ONLINE] Socket connected:", socket.id);

        socket.on(EMIT_SOCKET.REGISTER_USER, (data: { userId: string }) => {
            console.log(`[USER_ONLINE] User registered: ${data.userId}`);
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