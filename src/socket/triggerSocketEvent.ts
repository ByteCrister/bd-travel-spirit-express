// G:\Projects\bd-travel-spirit-express\src\socket\triggerSocketEvent.ts
import { getUserSocketId } from "../services/socketUserMap";
import { EmitUserAgentChatType, SocketNamespaceType } from "../constants/constants";
import { getIOInstance } from "./setIOInstance";

interface TriggerSocketParams {
    userId: string;
    type: EmitUserAgentChatType;
    data: unknown;
    namespace: SocketNamespaceType;
}

export const triggerSocketEvent = async ({
    userId,
    type,
    data,
    namespace,
}: TriggerSocketParams) => {
    const io = getIOInstance();

    if (!io) {
        console.warn("Socket.IO instance not initialized");
        return;
    }

    const namespaceIo = io.of(namespace);  // get chat instance
    const socketId = getUserSocketId(userId);

    if (!socketId) {
        console.warn(` No active socketId found for userId: ${userId}`);
        return;
    }

    try {
        namespaceIo.to(socketId).emit(type, { userId, data });
        console.log(`---------------- Socket event '${type}' sent to userId: ${userId} on namespace '${namespace}' ---------------`);
    } catch (err) {
        console.error("Error triggering socket event:", err);
    }
};