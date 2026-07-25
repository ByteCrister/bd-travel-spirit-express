// src/controllers/socketInitializer.ts (previously socketController.ts)
import { Server, Socket } from "socket.io";
import { EMIT_SOCKET, SOCKET_NAMESPACES, LISTEN_SOCKET_AGET_EVENT } from "../constants/constants";
import {
    registerUserSocket,
    removeUserByUserId,
} from "../services/socketUserMap";
import UserModel from "../models/user.model";          // we need this to build Agent info
import { USER_ROLE } from "../constants/user.const";
import AssetModel from "../models/assets/asset.model";
import AssetFileModel from "../models/assets/asset-file.model";

let initialized = false;

export function initializeSocket(io: Server) {
    if (initialized) return;
    initialized = true;

    const USER_ONLINE = io.of(SOCKET_NAMESPACES.USER_ONLINE);

    USER_ONLINE.on("connection", (socket: Socket) => {
        console.log("[USER_ONLINE] Socket connected:", socket.id);

        socket.on(EMIT_SOCKET.REGISTER_USER, async (data: { userId: string; owner_id?: string }) => {
            try {
                const { userId, owner_id } = data;

                // 1. Store in global map
                registerUserSocket(userId, socket.id, owner_id);
                socket.data.userId = userId;
                socket.data.owner_id = owner_id;

                // 2. If user belongs to a company, join the company room
                if (owner_id) {
                    const room = `company_${owner_id}`;
                    socket.join(room);

                    // 3. Fetch user details to broadcast as Agent
                    const user = await UserModel.findOne({
                        _id: userId,
                        role: { $in: [USER_ROLE.ADMIN, USER_ROLE.SUPPORT, USER_ROLE.ASSISTANT, USER_ROLE.GUIDE] },
                    })
                        .select("name email role createdAt updatedAt avatar")
                        .populate({
                            path: "avatar",
                            model: AssetModel,
                            select: "file",
                            populate: {
                                path: "file",
                                model: AssetFileModel,
                                select: "publicUrl",
                            },
                        })
                        .lean();

                    if (user) {
                        const role = user.role as string;
                        const assetDoc = (user as any).avatar;
                        const avatarUrl = assetDoc?.file?.publicUrl ?? null;

                        // ── Role-aware observability log ──────────────────────
                        const roomSize = (await USER_ONLINE.in(room).fetchSockets()).length;
                        const roleTag =
                            role === USER_ROLE.ADMIN    ? "👑 ADMIN"     :
                            role === USER_ROLE.SUPPORT  ? "🎧 SUPPORT"  :
                            role === USER_ROLE.GUIDE    ? "🗺  GUIDE"    :
                            role === USER_ROLE.ASSISTANT? "🤝 ASSISTANT" :
                            `❓ ${role.toUpperCase()}`;

                        console.log(
                            `[USER_ONLINE] ${roleTag} registered` +
                            ` | userId=${userId}` +
                            ` | room=${room}` +
                            ` | members_in_room=${roomSize}`
                        );

                        // Extra note when multiple admins share the same room
                        if (role === USER_ROLE.ADMIN && roomSize > 1) {
                            const adminCount = (await USER_ONLINE.in(room).fetchSockets())
                                .filter(s => s.data?.role === USER_ROLE.ADMIN).length;
                            if (adminCount > 0) {
                                console.log(
                                    `[USER_ONLINE] 👑 Multiple admins in room ${room}` +
                                    ` (${adminCount + 1} admins online)`
                                );
                            }
                        }
                        // ─────────────────────────────────────────────────────

                        // Store role on socket.data for use in disconnect
                        socket.data.role = role;

                        const agentPayload = {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email,
                            role,
                            avatar: avatarUrl,
                        };

                        // Broadcast to everyone ELSE in the room (sender won't get it)
                        USER_ONLINE.in(room).emit(LISTEN_SOCKET_AGET_EVENT.USER_CONNECTED, {
                            data: agentPayload,
                        });
                    }
                } else {
                    // User has no company affiliation (e.g. traveler)
                    console.log(`[USER_ONLINE] 🌐 User registered without room | userId=${userId}`);
                }
            } catch (err) {
                console.error("Error handling REGISTER_USER:", err);
            }
        });

        // Handle disconnect
        socket.on("disconnect", async (reason) => {
            const userId   = socket.data.userId;
            const owner_id = socket.data.owner_id;
            const role     = socket.data.role as string | undefined;

            if (userId) {
                removeUserByUserId(userId);

                if (owner_id) {
                    const room = `company_${owner_id}`;
                    const roleTag =
                        role === USER_ROLE.ADMIN    ? "👑 ADMIN"     :
                        role === USER_ROLE.SUPPORT  ? "🎧 SUPPORT"  :
                        role === USER_ROLE.GUIDE    ? "🗺  GUIDE"    :
                        role === USER_ROLE.ASSISTANT? "🤝 ASSISTANT" :
                        role ? `❓ ${role.toUpperCase()}` : "UNKNOWN";

                    console.log(
                        `[USER_ONLINE] ${roleTag} disconnected` +
                        ` | userId=${userId}` +
                        ` | room=${room}` +
                        ` | reason=${reason}`
                    );

                    USER_ONLINE.to(room).emit(LISTEN_SOCKET_AGET_EVENT.USER_DISCONNECTED, {
                        userId,
                    });
                } else {
                    console.log(
                        `[USER_ONLINE] 🌐 User disconnected (no room)` +
                        ` | userId=${userId}` +
                        ` | reason=${reason}`
                    );
                }
            }
        });

        // (Optional) Company event examples can go here (e.g., booking:deleted)
        // socket.on("booking:deleted", (...) => { ... });
    });

    // ... other namespaces
}