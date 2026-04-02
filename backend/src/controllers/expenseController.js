import mongoose from "mongoose";

import {
  createExpense as createExpenseRecord,
  deleteExpense as deleteExpenseRecord,
  listExpenses as listExpenseRecords,
  updateExpense as updateExpenseRecord,
} from "../data/dataAccess.js";
import { generateMonthlyReport } from "../services/reportingService.js";
import {
  getMonthKey,
  getMonthRange,
  normalizeMonth,
  normalizeText,
} from "../utils/formatters.js";

function serializeExpense(expense) {
  return {
    id: expense._id.toString(),
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    notes: expense.notes || "",
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

function buildExpensePayload(body) {
  return {
    amount: Number(body.amount),
    category: normalizeText(body.category),
    date: body.date ? new Date(body.date) : null,
    paymentMethod: normalizeText(body.paymentMethod),
    notes: normalizeText(body.notes),
  };
}

function validateExpensePayload(payload) {
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return "Amount must be a valid positive number.";
  }

  if (!payload.category) {
    return "Category is required.";
  }

  if (!(payload.date instanceof Date) || Number.isNaN(payload.date.getTime())) {
    return "Date is required.";
  }

  if (!payload.paymentMethod) {
    return "Payment method is required.";
  }

  return "";
}

export async function listExpenses(request, response) {
  const filter = {
    userId: request.user._id,
  };

  const search = normalizeText(request.query.search);
  const category = normalizeText(request.query.category);
  const paymentMethod = normalizeText(request.query.paymentMethod);
  const month = normalizeMonth(request.query.month);

  if (category) {
    filter.category = category;
  }

  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (month) {
    const { start, end } = getMonthRange(month);
    filter.date = { $gte: start, $lt: end };
  } else {
    const from = request.query.from ? new Date(`${request.query.from}`) : null;
    const to = request.query.to ? new Date(`${request.query.to}`) : null;

    if (from || to) {
      filter.date = {};
      if (from && !Number.isNaN(from.getTime())) {
        filter.date.$gte = from;
      }
      if (to && !Number.isNaN(to.getTime())) {
        filter.date.$lte = to;
      }
    }
  }

  if (search) {
    filter.search = search;
  }

  const expenses = await listExpenseRecords(filter);

  return response.json({
    expenses: expenses.map(serializeExpense),
  });
}

export async function createExpense(request, response) {
  const payload = buildExpensePayload(request.body);
  const validationError = validateExpensePayload(payload);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  const expense = await createExpenseRecord({
    userId: request.user._id,
    ...payload,
  });

  await generateMonthlyReport(request.user._id, getMonthKey(payload.date));

  return response.status(201).json({
    message: "Expense added successfully.",
    expense: serializeExpense(expense),
  });
}

export async function updateExpense(request, response) {
  const expenseId = request.params.id;

  if (!mongoose.isValidObjectId(expenseId)) {
    return response.status(400).json({ message: "Invalid expense id." });
  }

  const payload = buildExpensePayload(request.body);
  const validationError = validateExpensePayload(payload);

  if (validationError) {
    return response.status(400).json({ message: validationError });
  }

  const expense = await updateExpenseRecord({
    id: expenseId,
    userId: request.user._id,
    updates: payload,
  });

  if (!expense) {
    return response.status(404).json({ message: "Expense not found." });
  }

  await generateMonthlyReport(request.user._id, getMonthKey(payload.date));

  return response.json({
    message: "Expense updated successfully.",
    expense: serializeExpense(expense),
  });
}

export async function deleteExpense(request, response) {
  const expenseId = request.params.id;

  if (!mongoose.isValidObjectId(expenseId)) {
    return response.status(400).json({ message: "Invalid expense id." });
  }

  const expense = await deleteExpenseRecord({
    id: expenseId,
    userId: request.user._id,
  });

  if (!expense) {
    return response.status(404).json({ message: "Expense not found." });
  }

  await generateMonthlyReport(request.user._id, getMonthKey(expense.date));

  return response.json({ message: "Expense deleted successfully." });
}
