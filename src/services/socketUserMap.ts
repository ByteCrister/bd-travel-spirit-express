// src/services/socketUserMap.ts

export interface SocketUserData {
    socketId: string;
    owner_id?: string;          // optional – only company users
}

type SocketMap = Map<string, SocketUserData>;

declare global {
    // eslint-disable-next-line no-var
    var _userSocketMap: SocketMap | undefined;
}

export const getSocketMap = (): SocketMap => {
    if (!global._userSocketMap) {
        global._userSocketMap = new Map<string, SocketUserData>();
    }
    return global._userSocketMap;
};

// Register – owner_id is now optional
export const registerUserSocket = (
    userId: string,
    socketId: string,
    owner_id?: string
) => {
    const map = getSocketMap();
    map.set(userId, { socketId, owner_id });
    console.log(`User ${userId} registered with socket ${socketId}, company ${owner_id ?? 'none'}`);
};

// Remove by userId (the map key) – used on disconnect
export const removeUserByUserId = (userId: string): void => {
    getSocketMap().delete(userId);
};

// Remove by socketId (if needed for other cleanup)
export const removeUserBySocketId = (socketId: string): void => {
    const map = getSocketMap();
    for (const [userId, data] of map.entries()) {
        if (data.socketId === socketId) {
            map.delete(userId);
            break;
        }
    }
};

// Get socketId by userId
export const getUserSocketId = (userId: string): string | undefined => {
    return getSocketMap().get(userId)?.socketId;
};

// Get full data (includes optional owner_id)
export const getUserSocketData = (userId: string): SocketUserData | undefined => {
    return getSocketMap().get(userId);
};

// Get all online user IDs for a company (only those with that owner_id)
export const getOnlineUserIdsByOwner = (ownerId: string): string[] => {
    const map = getSocketMap();
    const ids: string[] = [];
    for (const [userId, data] of map.entries()) {
        if (data.owner_id === ownerId) {
            ids.push(userId);
        }
    }
    return ids;
};

// Get userId by socketId (unchanged)
export const getUserIdBySocketId = (socketId: string): string | null => {
    const map = getSocketMap();
    for (const [userId, data] of map.entries()) {
        if (data.socketId === socketId) {
            return userId;
        }
    }
    return null;
};