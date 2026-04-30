// models/asset-file.model.ts
import { Schema, Document, Model, ClientSession, Types } from "mongoose";
import { STORAGE_PROVIDER, StorageProvider } from "../../constants/asset.const";
import { defineModel } from "../../lib/defineModel";

export interface IAssetFile extends Document {
    storageProvider: StorageProvider;

    objectKey: string;
    publicUrl: string;

    contentType: string;
    fileSize: number;
    checksum: string;

    refCount: number;

    createdAt: Date;
    updatedAt: Date;
}

export interface IAssetFileModel extends Model<IAssetFile> {
    incrementRef(fileId: string, session?: ClientSession): Promise<void>;
    decrementRef(fileId: string, session?: ClientSession): Promise<IAssetFile | null>;
    decrementManyRef(fileId: string[], session?: ClientSession): Promise<IAssetFile | null>;
}

const AssetFileSchema = new Schema<IAssetFile, IAssetFileModel>(
    {
        storageProvider: {
            type: String,
            enum: Object.values(STORAGE_PROVIDER),
            required: true,
        },

        objectKey: { type: String, required: true },
        publicUrl: { type: String, required: true, index: true },

        contentType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        checksum: { type: String, required: true },

        refCount: { type: Number, default: 1, min: 0 },
    },
    { timestamps: true, versionKey: false }
);

AssetFileSchema.index({ checksum: 1 }, { unique: true });

/* =========================================================
 * Statics
 * ======================================================= */
AssetFileSchema.statics.incrementRef = async function (
    fileId: string,
    session?: ClientSession
) {
    await this.updateOne(
        { _id: fileId },
        { $inc: { refCount: 1 } },
        { session }
    ).exec();
};

AssetFileSchema.statics.decrementRef = async function (
    fileId: string,
    session?: ClientSession
) {
    return this.findOneAndUpdate(
        { _id: fileId },
        { $inc: { refCount: -1 } },
        { new: true, session }
    ).exec();
};


/**
 * Decrement refCount for multiple AssetFiles in a single query
 */
AssetFileSchema.statics.decrementManyRef = async function (
    fileIds: string[] | Types.ObjectId[],
    session?: ClientSession
) {
    if (!fileIds?.length) return;

    await this.updateMany(
        { _id: { $in: fileIds } },
        { $inc: { refCount: -1 } },
        { session }
    ).exec();
};

const AssetFileModel = defineModel(
    "AssetFile",
    AssetFileSchema
) as unknown as IAssetFileModel;

export default AssetFileModel;