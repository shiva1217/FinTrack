import { Router } from "express";

import {
  getDashboardSummary,
  getMonthlyReports,
} from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get("/reports", getMonthlyReports);
dashboardRouter.get("/summary", getDashboardSummary);
