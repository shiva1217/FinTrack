import {
  deleteBudget as deleteBudgetRecord,
  listBudgets as listBudgetRecords,
  listExpenses as listExpenseRecords,
  upsertBudget as upsertBudgetRecord,
} from "../data/dataAccess.js";
import { generateMonthlyReport } from "../services/reportingService.js";
import { getMonthRange, normalizeMonth, normalizeText } from "../utils/formatters.js";

function serializeBudget(budget) {
  return {
    id: budget._id.toString(),
    category: budget.category,
    month: budget.month,
    limit: budget.limit,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

async function buildBudgetStatus(userId, month) {
  const budgets = await listBudgetRecords({ userId, month });
  const { start, end } = getMonthRange(month);
  const expenses = await listExpenseRecords({
    userId,
    date: { $gte: start, $lt: end },
  });

  const spentByCategory = new Map();

  for (const expense of expenses) {
    spentByCategory.set(
      expense.category,
      (spentByCategory.get(expense.category) || 0) + expense.amount,
    );
  }

  return budgets.map((budget) => {
    const spent = spentByCategory.get(budget.category) || 0;
    const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    let alertLevel = "safe";

    if (percentUsed >= 100) {
      alertLevel = "danger";
    } else if (percentUsed >= 80) {
      alertLevel = "warning";
    }

    return {
      ...serializeBudget(budget),
      spent,
      percentUsed: Number(percentUsed.toFixed(2)),
      alertLevel,
    };
  });
}

export async function listBudgets(request, response) {
  const month = normalizeMonth(request.query.month);

  if (!month) {
    return response.status(400).json({ message: "A valid month is required." });
  }

  const budgets = await buildBudgetStatus(request.user._id, month);

  return response.json({ budgets });
}

export async function upsertBudget(request, response) {
  const category = normalizeText(request.body.category);
  const month = normalizeMonth(request.body.month);
  const limit = Number(request.body.limit);

  if (!category || !month || !Number.isFinite(limit) || limit <= 0) {
    return response.status(400).json({
      message: "Category, month, and a positive limit are required.",
    });
  }

  const budget = await upsertBudgetRecord({
    userId: request.user._id,
    category,
    month,
    limit,
  });

  await generateMonthlyReport(request.user._id, month);

  return response.status(201).json({
    message: "Budget saved successfully.",
    budget: serializeBudget(budget),
  });
}

export async function deleteBudget(request, response) {
  const category = normalizeText(request.params.category);
  const month = normalizeMonth(request.query.month);

  if (!category || !month) {
    return response.status(400).json({ message: "Category and month are required." });
  }

  const deletedBudget = await deleteBudgetRecord({
    userId: request.user._id,
    category,
    month,
  });

  if (!deletedBudget) {
    return response.status(404).json({ message: "Budget not found." });
  }

  await generateMonthlyReport(request.user._id, month);

  return response.json({ message: "Budget deleted successfully." });
}
