import { listExpenses, listUsers } from "../data/dataAccess.js";
import { getMonthKey, getMonthRange, normalizeMonth } from "../utils/formatters.js";

export async function getAdminOverview(request, response) {
  const month = normalizeMonth(request.query.month) || getMonthKey();
  const { start, end } = getMonthRange(month);

  const [users, expenses] = await Promise.all([
    listUsers(),
    listExpenses({ date: { $gte: start, $lt: end } }),
  ]);
  const standardUsers = users.filter((user) => user.role !== "admin");

  const spendingByUser = new Map();
  const expenseCountByUser = new Map();
  const latestExpenseAtByUser = new Map();

  for (const expense of expenses) {
    const key = expense.userId.toString();
    spendingByUser.set(key, (spendingByUser.get(key) || 0) + expense.amount);
    expenseCountByUser.set(key, (expenseCountByUser.get(key) || 0) + 1);

    const latestRecordedExpense = latestExpenseAtByUser.get(key);
    if (!latestRecordedExpense || expense.createdAt > latestRecordedExpense) {
      latestExpenseAtByUser.set(key, expense.createdAt);
    }
  }

  const userSpending = standardUsers
    .map((user) => ({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      totalSpent: spendingByUser.get(user._id.toString()) || 0,
      expenseCount: expenseCountByUser.get(user._id.toString()) || 0,
      latestExpenseAt: latestExpenseAtByUser.get(user._id.toString()) || null,
    }))
    .sort((left, right) => right.totalSpent - left.totalSpent);

  return response.json({
    month,
    totalUsers: standardUsers.length,
    totalSpentAcrossUsers: userSpending.reduce((sum, user) => sum + user.totalSpent, 0),
    userSpending,
  });
}
