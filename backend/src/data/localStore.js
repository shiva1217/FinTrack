import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { getMonthKey } from "../utils/formatters.js";

const storagePath = path.resolve("data", "local-db.json");

function createId() {
  return new mongoose.Types.ObjectId().toString();
}

function nowIso() {
  return new Date().toISOString();
}

function cloneWithDates(record) {
  if (!record) {
    return null;
  }

  return {
    ...record,
    date: record.date ? new Date(record.date) : record.date,
    createdAt: record.createdAt ? new Date(record.createdAt) : record.createdAt,
    updatedAt: record.updatedAt ? new Date(record.updatedAt) : record.updatedAt,
  };
}

function createDemoState() {
  const month = getMonthKey();
  const [year, monthNumber] = month.split("-").map(Number);
  const createdAt = nowIso();
  const demoUserId = createId();
  const adminUserId = createId();

  return {
    users: [
      {
        _id: demoUserId,
        name: "Demo User",
        username: "demo_user",
        phone: "9876543210",
        profilePicture: "",
        email: "user@example.com",
        passwordHash: bcrypt.hashSync("123456", 10),
        role: "user",
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: adminUserId,
        name: "Admin User",
        username: "admin_user",
        phone: "9876500000",
        profilePicture: "",
        email: "admin@example.com",
        passwordHash: bcrypt.hashSync("123456", 10),
        role: "admin",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    expenses: [
      {
        _id: createId(),
        userId: demoUserId,
        amount: 1200,
        category: "Food",
        paymentMethod: "UPI",
        notes: "Groceries",
        date: new Date(Date.UTC(year, monthNumber - 1, 2)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        amount: 18000,
        category: "Rent",
        paymentMethod: "Net Banking",
        notes: "Monthly rent",
        date: new Date(Date.UTC(year, monthNumber - 1, 3)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        amount: 2400,
        category: "Travel",
        paymentMethod: "Credit Card",
        notes: "Cab and metro",
        date: new Date(Date.UTC(year, monthNumber - 1, 8)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        amount: 3200,
        category: "Shopping",
        paymentMethod: "UPI",
        notes: "Clothes",
        date: new Date(Date.UTC(year, monthNumber - 1, 14)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        amount: 900,
        category: "Food",
        paymentMethod: "Cash",
        notes: "Dining out",
        date: new Date(Date.UTC(year, monthNumber - 1, 17)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        amount: 1600,
        category: "Bills",
        paymentMethod: "Debit Card",
        notes: "Electricity and internet",
        date: new Date(Date.UTC(year, monthNumber - 1, 19)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: adminUserId,
        amount: 5000,
        category: "Travel",
        paymentMethod: "Credit Card",
        notes: "Team trip",
        date: new Date(Date.UTC(year, monthNumber - 1, 10)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: adminUserId,
        amount: 2200,
        category: "Food",
        paymentMethod: "UPI",
        notes: "Office lunch",
        date: new Date(Date.UTC(year, monthNumber - 1, 12)).toISOString(),
        createdAt,
        updatedAt: createdAt,
      },
    ],
    budgets: [
      {
        _id: createId(),
        userId: demoUserId,
        category: "Food",
        month,
        limit: 3000,
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        category: "Travel",
        month,
        limit: 2500,
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: demoUserId,
        category: "Shopping",
        month,
        limit: 3500,
        createdAt,
        updatedAt: createdAt,
      },
      {
        _id: createId(),
        userId: adminUserId,
        category: "Travel",
        month,
        limit: 6000,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

let state;

function persistState() {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  fs.writeFileSync(storagePath, JSON.stringify(state, null, 2));
}

function loadState() {
  if (state) {
    return state;
  }

  if (fs.existsSync(storagePath)) {
    state = JSON.parse(fs.readFileSync(storagePath, "utf8"));
  } else {
    state = createDemoState();
    persistState();
  }

  return state;
}

export function ensureLocalData() {
  return loadState();
}

export function listUsers() {
  return loadState().users.map((user) => cloneWithDates(user));
}

export function findUserByEmail(email) {
  return cloneWithDates(loadState().users.find((user) => user.email === email));
}

export function findUserById(id) {
  return cloneWithDates(loadState().users.find((user) => user._id === id));
}

export function findUserByUsername(username) {
  return cloneWithDates(loadState().users.find((user) => user.username === username));
}

export function createUser({ email, passwordHash, role = "user", name = "", username = "", phone = "", profilePicture = "" }) {
  const timestamp = nowIso();
  const user = {
    _id: createId(),
    name,
    username,
    phone,
    profilePicture,
    email,
    passwordHash,
    role,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  loadState().users.push(user);
  persistState();
  return cloneWithDates(user);
}

export function upsertUser({ email, passwordHash, role = "user", name = "", username = "", phone = "", profilePicture = "" }) {
  const existingUser = loadState().users.find((user) => user.email === email);
  const timestamp = nowIso();

  if (existingUser) {
    existingUser.passwordHash = passwordHash;
    existingUser.role = role;
    existingUser.name = name;
    existingUser.username = username;
    existingUser.phone = phone;
    existingUser.profilePicture = profilePicture;
    existingUser.updatedAt = timestamp;
    persistState();
    return cloneWithDates(existingUser);
  }

  return createUser({ email, passwordHash, role, name, username, phone, profilePicture });
}

export function updateUser({ userId, updates }) {
  const user = loadState().users.find((entry) => entry._id === userId.toString());

  if (!user) {
    return null;
  }

  Object.assign(user, updates, { updatedAt: nowIso() });
  persistState();
  return cloneWithDates(user);
}

export function deleteUser({ userId }) {
  const currentState = loadState();
  const userIndex = currentState.users.findIndex((entry) => entry._id === userId.toString());

  if (userIndex === -1) {
    return null;
  }

  const [deletedUser] = currentState.users.splice(userIndex, 1);
  currentState.expenses = currentState.expenses.filter((expense) => expense.userId !== userId.toString());
  currentState.budgets = currentState.budgets.filter((budget) => budget.userId !== userId.toString());
  persistState();
  return cloneWithDates(deletedUser);
}

export function listExpenses(filter = {}) {
  const searchText = filter.search?.toLowerCase();

  return loadState().expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);

      if (filter.userId && expense.userId !== filter.userId.toString()) {
        return false;
      }

      if (filter.id && expense._id !== filter.id) {
        return false;
      }

      if (filter.category && expense.category !== filter.category) {
        return false;
      }

      if (filter.paymentMethod && expense.paymentMethod !== filter.paymentMethod) {
        return false;
      }

      if (filter.date?.$gte && expenseDate < filter.date.$gte) {
        return false;
      }

      if (filter.date?.$lt && expenseDate >= filter.date.$lt) {
        return false;
      }

      if (filter.date?.$lte && expenseDate > filter.date.$lte) {
        return false;
      }

      if (searchText) {
        const haystack = [
          expense.category,
          expense.paymentMethod,
          expense.notes || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchText)) {
          return false;
        }
      }

      return true;
    })
    .map((expense) => cloneWithDates(expense))
    .sort((left, right) => {
      const dateDiff = right.date.getTime() - left.date.getTime();

      if (dateDiff !== 0) {
        return dateDiff;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });
}

export function createExpense(payload) {
  const timestamp = nowIso();
  const expense = {
    _id: createId(),
    userId: payload.userId.toString(),
    amount: payload.amount,
    category: payload.category,
    date: payload.date.toISOString(),
    paymentMethod: payload.paymentMethod,
    notes: payload.notes || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  loadState().expenses.push(expense);
  persistState();
  return cloneWithDates(expense);
}

export function updateExpense({ id, userId, updates }) {
  const expense = loadState().expenses.find(
    (entry) => entry._id === id && entry.userId === userId.toString(),
  );

  if (!expense) {
    return null;
  }

  expense.amount = updates.amount;
  expense.category = updates.category;
  expense.date = updates.date.toISOString();
  expense.paymentMethod = updates.paymentMethod;
  expense.notes = updates.notes || "";
  expense.updatedAt = nowIso();
  persistState();

  return cloneWithDates(expense);
}

export function deleteExpense({ id, userId }) {
  const currentState = loadState();
  const index = currentState.expenses.findIndex(
    (entry) => entry._id === id && entry.userId === userId.toString(),
  );

  if (index === -1) {
    return null;
  }

  const [removed] = currentState.expenses.splice(index, 1);
  persistState();
  return cloneWithDates(removed);
}

export function replaceExpensesForUsers(userIds, expenses) {
  const targetIds = new Set(userIds.map((id) => id.toString()));
  const currentState = loadState();
  currentState.expenses = currentState.expenses.filter(
    (expense) => !targetIds.has(expense.userId.toString()),
  );

  for (const expense of expenses) {
    currentState.expenses.push({
      _id: createId(),
      userId: expense.userId.toString(),
      amount: expense.amount,
      category: expense.category,
      date: expense.date.toISOString(),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  persistState();
}

export function listBudgets(filter = {}) {
  return loadState().budgets
    .filter((budget) => {
      if (filter.userId && budget.userId !== filter.userId.toString()) {
        return false;
      }

      if (filter.month && budget.month !== filter.month) {
        return false;
      }

      if (filter.category && budget.category !== filter.category) {
        return false;
      }

      return true;
    })
    .map((budget) => cloneWithDates(budget))
    .sort((left, right) => left.category.localeCompare(right.category));
}

export function upsertBudget({ userId, category, month, limit }) {
  const currentState = loadState();
  const timestamp = nowIso();
  const existingBudget = currentState.budgets.find(
    (budget) =>
      budget.userId === userId.toString() &&
      budget.category === category &&
      budget.month === month,
  );

  if (existingBudget) {
    existingBudget.limit = limit;
    existingBudget.updatedAt = timestamp;
    persistState();
    return cloneWithDates(existingBudget);
  }

  const budget = {
    _id: createId(),
    userId: userId.toString(),
    category,
    month,
    limit,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  currentState.budgets.push(budget);
  persistState();
  return cloneWithDates(budget);
}

export function deleteBudget({ userId, category, month }) {
  const currentState = loadState();
  const index = currentState.budgets.findIndex(
    (budget) =>
      budget.userId === userId.toString() &&
      budget.category === category &&
      budget.month === month,
  );

  if (index === -1) {
    return null;
  }

  const [removed] = currentState.budgets.splice(index, 1);
  persistState();
  return cloneWithDates(removed);
}

export function replaceBudgetsForUsers(userIds, budgets) {
  const targetIds = new Set(userIds.map((id) => id.toString()));
  const currentState = loadState();
  currentState.budgets = currentState.budgets.filter(
    (budget) => !targetIds.has(budget.userId.toString()),
  );

  for (const budget of budgets) {
    currentState.budgets.push({
      _id: createId(),
      userId: budget.userId.toString(),
      category: budget.category,
      month: budget.month,
      limit: budget.limit,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  persistState();
}
