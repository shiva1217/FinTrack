import { Router } from "express";

import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expenseController.js";
import { requireAuth } from "../middleware/auth.js";

export const expenseRouter = Router();

expenseRouter.use(requireAuth);
expenseRouter.get("/", listExpenses);
expenseRouter.post("/", createExpense);
expenseRouter.put("/:id", updateExpense);
expenseRouter.delete("/:id", deleteExpense);
