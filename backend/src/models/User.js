import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
      sparse: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    profilePicture: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
