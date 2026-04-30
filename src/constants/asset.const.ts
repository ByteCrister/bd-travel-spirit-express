// constants/asset.const.ts
export enum STORAGE_PROVIDER {
    S3 = "s3",
    GCS = "gcs",
    LOCAL = "local",
    CLOUDINARY = "cloudinary",
}
export type StorageProvider = `${STORAGE_PROVIDER}`;

export enum VISIBILITY {
    PRIVATE = "private",
    UNLISTED = "unlisted",
    PUBLIC = "public",
}
export type Visibility = `${VISIBILITY}`;

export enum MODERATION_STATUS {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
}
export type ModerationStatus = `${MODERATION_STATUS}`;

export enum ASSET_TYPE {
    IMAGE = "image",
    VIDEO = "video",
    DOCUMENT = "document",
    AUDIO = "audio",
    PDF = "pdf",
    OTHER = "other"
}
export type AssetType = `${ASSET_TYPE}`;