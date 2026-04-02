import {
  listBudgets as listBudgetRecords,
  listExpenses as listExpenseRecords,
} from "../data/dataAccess.js";
import { getSmartSuggestions } from "../services/insightService.js";
import {
  getAllMonthlyReports,
  getAllMonthlyReportsForUsers,
  generateMonthlyReport,
  getRecentMonthlyReports,
} from "../services/reportingService.js";
import { listUsers } from "../data/dataAccess.js";
import { getMonthKey, getMonthRange, normalizeMonth } from "../utils/formatters.js";

function getTopEntries(entries, limit) {
  return [...entries.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, amount]) => ({ name, amount }));
}

function getDailyTrend(expenses) {
  const totals = new Map();

  for (const expense of expenses) {
    const key = new Date(expense.date).toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) || 0) + expense.amount);
  }

  return [...totals.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, amount]) => ({ date, amount }));
}

export async function getDashboardSummary(request, response) {
  const userId = request.user._id;
  const month = normalizeMonth(request.query.month) || getMonthKey();
  const { start, end } = getMonthRange(month);

  const [expenses, budgets] = await Promise.all([
    listExpenseRecords({ userId, date: { $gte: start, $lt: end } }),
    listBudgetRecords({ userId, month }),
  ]);

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = new Map();
  const paymentMethodTotals = new Map();

  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + expense.amount,
    );
    paymentMethodTotals.set(
      expense.paymentMethod,
      (paymentMethodTotals.get(expense.paymentMethod) || 0) + expense.amount,
    );
  }

  const topCategory = getTopEntries(categoryTotals, 1)[0] || null;
  const topPaymentMethods = getTopEntries(paymentMethodTotals, 3);
  const categoryBreakdown = getTopEntries(categoryTotals, categoryTotals.size);
  const spendingTrend = getDailyTrend(expenses);

  const budgetStatus = budgets.map((budget) => {
    const spent = categoryTotals.get(budget.category) || 0;
    const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    let alertLevel = "safe";

    if (percentUsed >= 100) {
      alertLevel = "danger";
    } else if (percentUsed >= 80) {
      alertLevel = "warning";
    }

    return {
      category: budget.category,
      month: budget.month,
      limit: budget.limit,
      spent,
      percentUsed: Number(percentUsed.toFixed(2)),
      alertLevel,
    };
  });

  const last30DaysStart = new Date();
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);

  const last30DaysExpenses = await listExpenseRecords({
    userId,
    date: { $gte: last30DaysStart },
  });

  const suggestions = await getSmartSuggestions(last30DaysExpenses);
  await generateMonthlyReport(userId, month);
  const reports = await getRecentMonthlyReports(userId, 3);

  return response.json({
    currentMonth: month,
    totalSpent,
    topCategory,
    topPaymentMethods,
    categoryBreakdown,
    spendingTrend,
    recentExpenses: expenses.slice(0, 8).map((expense) => ({
      id: expense._id.toString(),
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    })),
    budgetStatus,
    suggestions,
    reports,
  });
}

export async function getMonthlyReports(request, response) {
  if (request.user.role === "admin") {
    const users = await listUsers();
    const standardUserIds = users
      .filter((user) => user.role !== "admin")
      .map((user) => user._id.toString());
    const reports = await getAllMonthlyReportsForUsers(standardUserIds);
    return response.json({ reports });
  }

  const reports = await getAllMonthlyReports(request.user._id);
  return response.json({ reports });
}
