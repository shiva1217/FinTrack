import { Router } from "express";

import {
  changeEmail,
  changePassword,
  deleteAccount,
  getCurrentUser,
  signIn,
  signUp,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/login", signIn);
authRouter.get("/me", requireAuth, getCurrentUser);
authRouter.patch("/profile", requireAuth, updateProfile);
authRouter.patch("/email", requireAuth, changeEmail);
authRouter.patch("/password", requireAuth, changePassword);
authRouter.delete("/me", requireAuth, deleteAccount);
