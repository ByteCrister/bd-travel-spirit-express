// G:\Projects\bd-travel-spirit-express\src\socket\setIOInstance.ts
import { Server as SocketIOServer } from "socket.io";

declare global {
    var _io: SocketIOServer | undefined;
}

export const setIOInstance = (instance: SocketIOServer) => {
    if (!global._io) {
        global._io = instance;
    } else {
        console.log("\nSocket.IO instance is already initialized.\n");
    }
};

export const getIOInstance = (): SocketIOServer | undefined => {
    return global._io;
};