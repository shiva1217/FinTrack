import fs from "node:fs";
import path from "node:path";

import initSqlJs from "sql.js";

import { env } from "../config/env.js";
import { listBudgets, listExpenses } from "../data/dataAccess.js";
import { getMonthKey, getMonthRange } from "../utils/formatters.js";

let sqlPromise;
let database;
let databasePath;

async function getDatabase() {
  if (database) {
    return database;
  }

  if (!sqlPromise) {
    sqlPromise = initSqlJs();
  }

  const SQL = await sqlPromise;
  databasePath = path.resolve(env.reportsDbPath);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  if (fs.existsSync(databasePath)) {
    database = new SQL.Database(fs.readFileSync(databasePath));
  } else {
    database = new SQL.Database();
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS monthly_reports (
      user_id TEXT NOT NULL,
      month TEXT NOT NULL,
      total_spent REAL NOT NULL,
      top_category TEXT NOT NULL,
      overbudget_categories TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, month)
    );
  `);

  persistDatabase();
  return database;
}

function persistDatabase() {
  if (!database || !databasePath) {
    return;
  }

  const data = database.export();
  fs.writeFileSync(databasePath, Buffer.from(data));
}

export async function generateMonthlyReport(userId, month = getMonthKey()) {
  const { start, end } = getMonthRange(month);

  const expenses = await listExpenses({
    userId,
    date: { $gte: start, $lt: end },
  });

  const budgets = await listBudgets({ userId, month });

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = new Map();

  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + expense.amount,
    );
  }

  const topCategory =
    [...categoryTotals.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ||
    "None";

  const overbudgetCategories = budgets
    .filter((budget) => (categoryTotals.get(budget.category) || 0) > budget.limit)
    .map((budget) => budget.category);

  const db = await getDatabase();
  const now = new Date().toISOString();
  const existing = db.exec(
    "SELECT created_at FROM monthly_reports WHERE user_id = ? AND month = ?",
    [userId.toString(), month],
  );
  const createdAt =
    existing[0]?.values?.[0]?.[0]?.toString() || now;

  db.run(
    `
    INSERT OR REPLACE INTO monthly_reports (
      user_id,
      month,
      total_spent,
      top_category,
      overbudget_categories,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId.toString(),
      month,
      totalSpent,
      topCategory,
      JSON.stringify(overbudgetCategories),
      createdAt,
      now,
    ],
  );

  persistDatabase();

  return {
    userId: userId.toString(),
    month,
    totalSpent,
    topCategory,
    overbudgetCategories,
  };
}

export async function getRecentMonthlyReports(userId, limit = 3) {
  const db = await getDatabase();
  const result = db.exec(
    `
    SELECT user_id, month, total_spent, top_category, overbudget_categories, created_at, updated_at
    FROM monthly_reports
    WHERE user_id = ?
    ORDER BY month DESC
    LIMIT ?
    `,
    [userId.toString(), limit],
  );

  const rows = result[0]?.values || [];

  return rows.map((row) => ({
    userId: row[0].toString(),
    month: row[1].toString(),
    totalSpent: Number(row[2]),
    topCategory: row[3].toString(),
    overbudgetCategories: JSON.parse(row[4].toString()),
    createdAt: row[5].toString(),
    updatedAt: row[6].toString(),
  }));
}

export async function getAllMonthlyReports(userId) {
  const db = await getDatabase();
  const result = db.exec(
    `
    SELECT user_id, month, total_spent, top_category, overbudget_categories, created_at, updated_at
    FROM monthly_reports
    WHERE user_id = ?
    ORDER BY month DESC
    `,
    [userId.toString()],
  );

  const rows = result[0]?.values || [];

  return rows.map((row) => ({
    userId: row[0].toString(),
    month: row[1].toString(),
    totalSpent: Number(row[2]),
    topCategory: row[3].toString(),
    overbudgetCategories: JSON.parse(row[4].toString()),
    createdAt: row[5].toString(),
    updatedAt: row[6].toString(),
  }));
}

export async function getAllMonthlyReportsForUsers(userIds) {
  if (!userIds.length) {
    return [];
  }

  const db = await getDatabase();
  const placeholders = userIds.map(() => "?").join(", ");
  const result = db.exec(
    `
    SELECT user_id, month, total_spent, top_category, overbudget_categories, created_at, updated_at
    FROM monthly_reports
    WHERE user_id IN (${placeholders})
    ORDER BY month DESC, total_spent DESC
    `,
    userIds.map((userId) => userId.toString()),
  );

  const rows = result[0]?.values || [];

  return rows.map((row) => ({
    userId: row[0].toString(),
    month: row[1].toString(),
    totalSpent: Number(row[2]),
    topCategory: row[3].toString(),
    overbudgetCategories: JSON.parse(row[4].toString()),
    createdAt: row[5].toString(),
    updatedAt: row[6].toString(),
  }));
}
