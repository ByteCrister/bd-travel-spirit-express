import {
    Schema,
    Types,
    Model,
    Query,
    ClientSession,
    HydratedDocument,
} from "mongoose";
import AssetFileModel from "./asset-file.model";
import { defineModel } from "../../lib/defineModel";
import { ASSET_TYPE, AssetType, Visibility, VISIBILITY } from "../../constants/asset.const";

/* =========================================================
 * Types
 * ======================================================= */

type Session = ClientSession | undefined;

/* =========================================================
 * Query helpers
 * ======================================================= */
interface AssetQueryHelpers {
    notDeleted(
        this: Query<HydratedDocument<IAsset>[], IAsset, AssetQueryHelpers>
    ): Query<HydratedDocument<IAsset>[], IAsset, AssetQueryHelpers>;
}

/* =========================================================
 * Asset document interface (PLAIN DATA ONLY)
 * ======================================================= */
export interface IAsset {
    _id?: Types.ObjectId;

    file: Types.ObjectId;

    assetType: AssetType;
    title?: string;
    description?: string;
    tags?: string[];

    visibility: Visibility;

    deletedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/* =========================================================
 * Instance methods
 * ======================================================= */
interface AssetMethods {
    softDelete(session?: Session): Promise<HydratedDocument<IAsset>>;
    restore(session?: Session): Promise<HydratedDocument<IAsset>>;
}

/* =========================================================
 * Asset model interface
 * ======================================================= */
export interface IAssetModel
    extends Model<IAsset, AssetQueryHelpers, AssetMethods> {
    softDeleteById(
        id: Types.ObjectId | string,
        session?: Session
    ): Promise<HydratedDocument<IAsset> | null>;

    restoreById(
        id: Types.ObjectId | string,
        session?: Session
    ): Promise<HydratedDocument<IAsset> | null>;

    softDeleteMany(
        filter: Record<string, unknown>,
        session?: Session
    ): Promise<{ matchedCount: number; modifiedCount: number }>;
}

/* =========================================================
 * Schema
 * ======================================================= */
const AssetSchema = new Schema<
    IAsset,
    IAssetModel,
    AssetMethods,
    AssetQueryHelpers
>(
    {
        file: {
            type: Schema.Types.ObjectId,
            ref: "AssetFile",
            required: true,
            index: true,
        },

        assetType: {
            type: String,
            enum: Object.values(ASSET_TYPE),
            default: ASSET_TYPE.OTHER,
            index: true,
        },

        title: { type: String, trim: true },
        description: { type: String, trim: true },
        tags: [{ type: String, lowercase: true, trim: true }],

        visibility: {
            type: String,
            enum: Object.values(VISIBILITY),
            default: VISIBILITY.PRIVATE,
            index: true,
        },

        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

/* =========================================================
 * Indexes
 * ======================================================= */
AssetSchema.index({ file: 1, deletedAt: 1 });
AssetSchema.index({ title: "text", description: "text", tags: "text" });

/* =========================================================
 * Query helpers
 * ======================================================= */
AssetSchema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
};

/* =========================================================
 * Hooks
 * ======================================================= */

AssetSchema.pre("save", async function () {
    const session = this.$session() ?? undefined;

    if (this.isNew) {
        // Only increment if this is a new Asset document
        // The AssetFile refCount was already incremented in upload.cloudinary.ts
        // when we did findOneAndUpdate with $inc: { refCount: 1 }
        return;
    } else if (this.isModified("deletedAt")) {
        if (this.deletedAt) {
            // Asset is being soft deleted - decrement refCount
            await AssetFileModel.decrementRef(this.file.toString(), session);
        } else {
            // Asset is being restored - increment refCount
            await AssetFileModel.incrementRef(this.file.toString(), session);
        }
    }
});

/* =========================================================
 * Instance methods
 * ======================================================= */
AssetSchema.methods.softDelete = async function (session?: Session) {
    if (this.deletedAt) return this;

    this.deletedAt = new Date();
    await this.save({ session });
    return this;
};

AssetSchema.methods.restore = async function (session?: Session) {
    if (!this.deletedAt) return this;

    this.deletedAt = null;
    await this.save({ session });
    return this;
};

/* =========================================================
 * Static methods
 * ======================================================= */
AssetSchema.statics.softDeleteById = async function (
    id: Types.ObjectId | string,
    session?: Session
) {
    const asset = await this.findOne({ _id: id, deletedAt: null }).session(session ?? null);
    if (!asset) return null;

    await asset.softDelete(session);
    return asset;
};

AssetSchema.statics.restoreById = async function (
    id: Types.ObjectId | string,
    session?: Session
) {
    const asset = await this.findOne({ _id: id, deletedAt: { $ne: null } }).session(
        session ?? null
    );
    if (!asset) return null;

    await asset.restore(session);
    return asset;
};

AssetSchema.statics.softDeleteMany = async function (
    filter: Record<string, unknown>,
    session?: Session
) {
    const assets = await this.find({ ...filter, deletedAt: null })
        .session(session ?? null)
        .select("_id file");

    if (!assets.length) return { matchedCount: 0, modifiedCount: 0 };

    const assetIds = assets.map(a => a._id);
    const fileIds = assets.map(a => a.file.toString());

    // 1️⃣ Soft-delete all assets in one query
    await this.updateMany(
        { _id: { $in: assetIds } },
        { $set: { deletedAt: new Date() } },
        { session }
    );

    // 2️⃣ Decrement refCount for all associated files at once
    await AssetFileModel.decrementManyRef(fileIds, session);

    return { matchedCount: assets.length, modifiedCount: assets.length };
};

/* =========================================================
 * Export
 * ======================================================= */
export const AssetModel = defineModel<IAsset, IAssetModel>(
    "Asset",
    AssetSchema
);

export default AssetModel;