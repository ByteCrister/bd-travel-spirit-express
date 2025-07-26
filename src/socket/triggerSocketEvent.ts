// G:\Projects\support.BDTravelSpirit.travel-express\src\socket\triggerUserAgentSocketEvent.ts
import { getUserSocketId } from "../services/socketUserMap";
import { EMIT_USER_AGENT_CHAT, SOCKET_NAMESPACES } from "../utils/constants";
import { getIOInstance } from "./setIOInstance";

interface TriggerSocketParams {
    userId: string;
    type: EMIT_USER_AGENT_CHAT;
    data: unknown;
    namespace: SOCKET_NAMESPACES;
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
    } catch (err) {
        console.error("Error triggering socket event:", err);
    }
};