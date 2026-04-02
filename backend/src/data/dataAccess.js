import { Budget } from "../models/Budget.js";
import { Expense } from "../models/Expense.js";
import { User } from "../models/User.js";
import { isLocalDataMode } from "../config/db.js";
import {
  createExpense as createLocalExpense,
  createUser as createLocalUser,
  deleteBudget as deleteLocalBudget,
  deleteExpense as deleteLocalExpense,
  deleteUser as deleteLocalUser,
  findUserByEmail as findLocalUserByEmail,
  findUserById as findLocalUserById,
  findUserByUsername as findLocalUserByUsername,
  listBudgets as listLocalBudgets,
  listExpenses as listLocalExpenses,
  listUsers as listLocalUsers,
  replaceBudgetsForUsers,
  replaceExpensesForUsers,
  upsertBudget as upsertLocalBudget,
  upsertUser as upsertLocalUser,
  updateExpense as updateLocalExpense,
  updateUser as updateLocalUser,
} from "./localStore.js";

export async function findUserByEmail(email) {
  if (isLocalDataMode()) {
    return findLocalUserByEmail(email);
  }

  return User.findOne({ email });
}

export async function findUserByUsername(username) {
  if (isLocalDataMode()) {
    return findLocalUserByUsername(username);
  }

  return User.findOne({ username });
}

export async function createUser(payload) {
  if (isLocalDataMode()) {
    return createLocalUser(payload);
  }

  return User.create(payload);
}

export async function upsertUser(payload) {
  if (isLocalDataMode()) {
    return upsertLocalUser(payload);
  }

  return User.findOneAndUpdate(
    { email: payload.email },
    payload,
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function findUserById(userId) {
  if (isLocalDataMode()) {
    return findLocalUserById(userId);
  }

  return User.findById(userId).select("-passwordHash");
}

export async function updateUser({ userId, updates }) {
  if (isLocalDataMode()) {
    return updateLocalUser({ userId, updates });
  }

  return User.findByIdAndUpdate(userId, updates, { new: true }).select("-passwordHash");
}

export async function deleteUserAccount({ userId }) {
  if (isLocalDataMode()) {
    return deleteLocalUser({ userId });
  }

  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    return null;
  }

  await Expense.deleteMany({ userId });
  await Budget.deleteMany({ userId });
  return deletedUser;
}

export async function listUsers() {
  if (isLocalDataMode()) {
    return listLocalUsers().map(({ passwordHash, ...user }) => user);
  }

  return User.find().select("email role createdAt").lean();
}

export async function listExpenses(filter = {}) {
  if (isLocalDataMode()) {
    return listLocalExpenses(filter);
  }

  const query = { ...filter };

  if (filter.search) {
    query.$or = [
      { category: { $regex: filter.search, $options: "i" } },
      { paymentMethod: { $regex: filter.search, $options: "i" } },
      { notes: { $regex: filter.search, $options: "i" } },
    ];
    delete query.search;
  }

  return Expense.find(query).sort({ date: -1, createdAt: -1 });
}

export async function createExpense(payload) {
  if (isLocalDataMode()) {
    return createLocalExpense(payload);
  }

  return Expense.create(payload);
}

export async function updateExpense({ id, userId, updates }) {
  if (isLocalDataMode()) {
    return updateLocalExpense({ id, userId, updates });
  }

  return Expense.findOneAndUpdate(
    { _id: id, userId },
    updates,
    { new: true },
  );
}

export async function deleteExpense({ id, userId }) {
  if (isLocalDataMode()) {
    return deleteLocalExpense({ id, userId });
  }

  return Expense.findOneAndDelete({ _id: id, userId });
}

export async function replaceExpenses(userIds, expenses) {
  if (isLocalDataMode()) {
    replaceExpensesForUsers(userIds, expenses);
    return;
  }

  await Expense.deleteMany({ userId: { $in: userIds } });
  await Expense.insertMany(expenses);
}

export async function listBudgets(filter = {}) {
  if (isLocalDataMode()) {
    return listLocalBudgets(filter);
  }

  return Budget.find(filter).sort({ category: 1 }).lean();
}

export async function upsertBudget(payload) {
  if (isLocalDataMode()) {
    return upsertLocalBudget(payload);
  }

  return Budget.findOneAndUpdate(
    {
      userId: payload.userId,
      category: payload.category,
      month: payload.month,
    },
    {
      limit: payload.limit,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function deleteBudget(payload) {
  if (isLocalDataMode()) {
    return deleteLocalBudget(payload);
  }

  return Budget.findOneAndDelete(payload);
}

export async function replaceBudgets(userIds, budgets) {
  if (isLocalDataMode()) {
    replaceBudgetsForUsers(userIds, budgets);
    return;
  }

  await Budget.deleteMany({ userId: { $in: userIds } });
  await Budget.insertMany(budgets);
}
