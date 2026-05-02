// G:\Projects\bd-travel-spirit-express\src\socket\triggerSocketEvent.ts
import { getUserSocketId } from "../services/socketUserMap";
import { EmitUserAgentChatType, SocketNamespaceType } from "../constants/constants";
import { getIOInstance } from "./setIOInstance";

export const triggerSocketEvent = async ({
    ownerId,
    userId,
    type,
    data,
    namespace,
}: {
    ownerId?: string;
    userId?: string;
    type: EmitUserAgentChatType;
    data: unknown;
    namespace: SocketNamespaceType;
}) => {
    const io = getIOInstance();
    if (!io) {
        console.warn("Socket.IO instance not initialized");
        return;
    }

    const namespaceIo = io.of(namespace);

    if (ownerId) {
        // Broadcast to the room
        const room = `company_${ownerId}`;
        namespaceIo.in(room).emit(type, { data });
        console.log(`Socket event '${type}' sent to room '${room}' on namespace '${namespace}'`);
        return;
    } else if (userId) {
        // Single user logic
        const socketId = getUserSocketId(userId);
        if (!socketId) {
            console.warn(`No active socketId found for userId: ${userId}`);
            return;
        }
        namespaceIo.to(socketId).emit(type, { userId, data });
        console.log(`Socket event '${type}' sent to userId: ${userId}`);
    } else {
        console.warn(`No userId or ownerId provided`);
        return;
    }

};