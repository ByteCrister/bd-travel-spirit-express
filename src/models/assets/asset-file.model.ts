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


    createdAt: Date;
    updatedAt: Date;
}

export interface IAssetFileModel extends Model<IAssetFile> {}

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

    },
    { timestamps: true, versionKey: false }
);

AssetFileSchema.index({ checksum: 1 }, { unique: true });

const AssetFileModel = defineModel(
    "AssetFile",
    AssetFileSchema
) as unknown as IAssetFileModel;

export default AssetFileModel;