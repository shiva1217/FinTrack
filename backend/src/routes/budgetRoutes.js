import { Router } from "express";

import {
  deleteBudget,
  listBudgets,
  upsertBudget,
} from "../controllers/budgetController.js";
import { requireAuth } from "../middleware/auth.js";

export const budgetRouter = Router();

budgetRouter.use(requireAuth);
budgetRouter.get("/", listBudgets);
budgetRouter.post("/", upsertBudget);
budgetRouter.delete("/:category", deleteBudget);
