import mongoose from "mongoose";

import { env } from "./env.js";

export function isLocalDataMode() {
  return false;
}

export async function connectDatabase() {
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
}
