import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { budgetRouter } from "./routes/budgetRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { expenseRouter } from "./routes/expenseRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientOrigin,
    }),
  );
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      message: "Finance Tracker backend is running",
      health: "/api/health",
    });
  });

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/expenses", expenseRouter);
  app.use("/api/budgets", budgetRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(errorHandler);

  return app;
}
