// user.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import validator from 'validator';
import { USER_ROLE, UserRole } from "../constants/user.const";
import { defineModel } from "../lib/defineModel";

const passwordRegex = /^(?=.{6,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/

export interface IUser {
    name: string;
    avatar?: Types.ObjectId;
    email: string;
    password: string;
    role: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IUserDoc extends IUser, Document {
    comparePassword(candidate: string): Promise<boolean>;
    safeToJSON(): Omit<IUser, "password">;
}

export interface IUserModel extends mongoose.Model<IUserDoc> {
    findByEmail(email: string): Promise<IUserDoc | null>;
    authenticate(email: string, password: string): Promise<IUserDoc | null>;
}

const UserSchema = new Schema<IUserDoc, IUserModel>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        avatar: {
            type: Schema.Types.ObjectId,
            ref: "Asset",
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: (v: string) => validator.isEmail(v, { allow_utf8_local_part: false }),
                message: 'Invalid email address'
            }
        },
        password: {
            type: String,
            required: true,
            select: false,
            minlength: 6,
            validate: {
                validator: (v: string) => passwordRegex.test(v),
                message:
                    'Password must be at least 6 characters and include uppercase, lowercase, number, and special character'
            }
        },
        role: { type: String, enum: Object.values(USER_ROLE), required: true, default: "traveler" },
    },
    {
        timestamps: true,
        versionKey: false,
        strict: true,
        toJSON: {
            transform: (_doc, ret: Partial<IUserDoc>) => {
                delete ret.password;
                return ret;
            },
        },
    }
);

UserSchema.pre<IUserDoc>("save", async function (next) {
    if (!this.isModified("password")) return next();
    const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = async function (this: IUserDoc, candidate: string) {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.safeToJSON = function (this: IUserDoc) {
    const obj = this.toObject({ getters: true }) as Omit<IUser, "password">;
    return obj;
};

UserSchema.statics.findByEmail = function (this: IUserModel, email: string) {
    return this.findOne({ email: email.toLowerCase().trim() }).select("+password");
};

UserSchema.statics.authenticate = async function (this: IUserModel, email: string, password: string) {
    const user = await this.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) return null;

    const match = await bcrypt.compare(password, user.password ?? "");
    if (!match) return null;

    return this.findById(user._id);
};

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

export const UserModel = defineModel("User", UserSchema);
export default UserModel;