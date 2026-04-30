import mongoose, { Schema, Model } from "mongoose";

/**
 * UNIVERSAL MONGOOSE MODEL WRAPPER
 * Prevents OverwriteModelError & supports HMR in Next.js
 */
export function defineModel<T, M extends Model<T>>(
    name: string,
    schema: Schema<T, M>
): M {
    if (mongoose.models[name]) {
        return mongoose.models[name] as M;
    }
    return mongoose.model<T, M>(name, schema);
}