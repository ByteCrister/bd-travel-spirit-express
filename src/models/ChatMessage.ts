// G:\Projects\bd-travel-spirit-express\src\models\ChatMessage.ts
import mongoose, { Schema, Document } from "mongoose";

/**
 * Moderation status values — kept in sync with frontend constants.
 */
const MODERATION_STATUS = {
    CLEAN: "clean",
    FLAGGED: "flagged",
    REMOVED: "removed",
} as const;

type ModerationStatusType = (typeof MODERATION_STATUS)[keyof typeof MODERATION_STATUS];

/**
 * Chat message document interface.
 * Represents a single text message exchanged between two users.
 */
export interface IChatMessage extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    message: string;
    timestamp: Date;
    isDraft: boolean;
    isRead: boolean;
    isDelivered: boolean;
    isEdited: boolean;
    isDeletedBySender: boolean;
    isDeletedByReceiver: boolean;
    moderationStatus: ModerationStatusType;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        isDraft: {
            type: Boolean,
            default: false,
            index: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        isDelivered: {
            type: Boolean,
            default: false,
            index: true,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeletedBySender: {
            type: Boolean,
            default: false,
        },
        isDeletedByReceiver: {
            type: Boolean,
            default: false,
        },
        moderationStatus: {
            type: String,
            enum: Object.values(MODERATION_STATUS),
            default: MODERATION_STATUS.CLEAN,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
ChatMessageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });
ChatMessageSchema.index(
    { sender: 1, receiver: 1, isDraft: 1 },
    { unique: true, partialFilterExpression: { isDraft: true } }
);
// Fast conversation lookups
ChatMessageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export const ChatMessageModel =
    mongoose.models.ChatMessage ||
    mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
