import { Router } from "express";

import { getAdminOverview } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/admin.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/overview", getAdminOverview);
