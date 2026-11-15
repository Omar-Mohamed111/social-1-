import mongoose, { Schema } from "mongoose";
import { Provider, Gender } from "../../auth/enum/enum";
import { IUser } from "../interface/user.interface";

const userSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 20,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    maxlength: 254,
  },

  password: {
    type: String,
    required: function (this: IUser) {
      return this.provider === Provider.LOCAL;
    },
  },

  provider: {
    type: Number,
    default: Provider.LOCAL,
    enum: Object.values(Provider).filter((value) => typeof value === "number"),
  },

  gender: {
    type: Number,
    default: Gender.MALE,
    enum: Object.values(Gender).filter((value) => typeof value === "number"),
  },

  phoneNumber: {
    type: String,
    trim: true,
  },

  refreshTokenHash: {
    type: String,
    required: false,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },

  isTwoFactorEnabled: {
    type: Boolean,
    default: false,
  },

  twoFactorSecret: {
    type: String,
    select: false,
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
