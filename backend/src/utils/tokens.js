import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function createAuthToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
