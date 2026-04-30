import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { USER_ROLE } from "../constants/user.const";
import { getSocketMap } from "../services/socketUserMap";
import UserModel from "../models/user.model";
import { getCollectionName } from "../lib/get-collection-name";
import AssetModel from "../models/assets/asset.model";
import AssetFileModel from "../models/assets/asset-file.model";

const onlineAgentsRouter = express.Router();

const VALID_ROLES = new Set<string>(Object.values(USER_ROLE));

interface AggregatedAgent {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    asset: Record<string, unknown> | null;
    assetFile: Record<string, unknown> | null;
}

onlineAgentsRouter.get("/online-agents", async (req: Request, res: Response) => {
    try {
        console.log("\n\n GET /online-agents\n\n");
        /* ── Auth ─────────────────────────────────────────── */
        const token = req.headers["x-api-key"];
        if (token !== process.env.SOCKET_API_SECRET_KEY) {
            return res.status(403).json({ message: "Forbidden" });
        }

        /* ── Parse & validate roles ───────────────────────── */
        const rolesParam = req.query["user-roles"];
        if (!rolesParam || typeof rolesParam !== "string") {
            return res.status(400).json({ message: "Missing or invalid 'user-roles' query parameter" });
        }

        const requestedRoles = rolesParam
            .split(",")
            .map((r) => r.trim().toLowerCase())
            .filter(Boolean);

        const invalidRoles = requestedRoles.filter((r) => !VALID_ROLES.has(r));
        if (invalidRoles.length) {
            return res.status(400).json({
                message: `Invalid role(s): ${invalidRoles.join(", ")}`,
                validRoles: Array.from(VALID_ROLES),
            });
        }

        if (!requestedRoles.length) {
            return res.status(400).json({ message: "At least one valid role is required" });
        }

        /* ── Online user IDs from socket map (strings) ─────── */
        const onlineUserIds = Array.from(getSocketMap().keys());
        console.log("onlineUserIds from map:", onlineUserIds); // debug

        if (!onlineUserIds.length) {
            return res.status(200).json({ data: [] });
        }

        // Convert to ObjectId array
        const objectIds = onlineUserIds.map((id) => new mongoose.Types.ObjectId(id));

        /* ── Aggregation: single query with both lookups ──── */
        const agents: AggregatedAgent[] = await UserModel.aggregate([
            {
                $match: {
                    _id: { $in: objectIds },          // use ObjectIds here
                    role: { $in: requestedRoles },
                },
            },
            {
                $lookup: {
                    from: getCollectionName(AssetModel),
                    localField: "avatar",
                    foreignField: "_id",
                    as: "avatar",
                },
            },
            { $unwind: { path: "$avatar", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: getCollectionName(AssetFileModel),
                    localField: "avatar.file",
                    foreignField: "_id",
                    as: "assetFile",
                },
            },
            { $unwind: { path: "$assetFile", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    avatarUrl: { $ifNull: ["$assetFile.publicUrl", null] },
                    asset: {
                        $cond: {
                            if: { $eq: ["$avatar", null] },
                            then: null,
                            else: "$avatar",
                        },
                    },
                    assetFile: {
                        $cond: {
                            if: { $eq: ["$assetFile", null] },
                            then: null,
                            else: "$assetFile",
                        },
                    },
                },
            },
        ]);

        const data = agents.map((agent) => ({
            id: agent._id,
            name: agent.name,
            email: agent.email,
            role: agent.role,
            avatar: agent.avatarUrl,
        }));

        return res.status(200).json({ data });
    } catch (error) {
        console.error("GET /online-agents error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default onlineAgentsRouter;