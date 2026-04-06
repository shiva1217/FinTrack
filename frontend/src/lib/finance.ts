import { getStoredAuthToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Budget = {
  id: string;
  category: string;
  month: string;
  limit: number;
  spent?: number;
  percentUsed?: number;
  alertLevel?: "safe" | "warning" | "danger";
};

export type DashboardSummary = {
  currentMonth: string;
  totalSpent: number;
  topCategory: { name: string; amount: number } | null;
  topPaymentMethods: Array<{ name: string; amount: number }>;
  categoryBreakdown: Array<{ name: string; amount: number }>;
  spendingTrend: Array<{ date: string; amount: number }>;
  recentExpenses: Expense[];
  budgetStatus: Array<{
    category: string;
    month: string;
    limit: number;
    spent: number;
    percentUsed: number;
    alertLevel: "safe" | "warning" | "danger";
  }>;
  suggestions: string[];
  reports: Array<{
    userId: string;
    month: string;
    totalSpent: number;
    topCategory: string;
    overbudgetCategories: string[];
    createdAt: string;
    updatedAt: string;
  }>;
};

export type MonthlyReport = {
  userId: string;
  month: string;
  totalSpent: number;
  topCategory: string;
  overbudgetCategories: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminOverview = {
  month: string;
  totalUsers: number;
  totalSpentAcrossUsers: number;
  userSpending: Array<{
    userId: string;
    email: string;
    role: "user" | "admin";
    createdAt: string;
    totalSpent: number;
    expenseCount: number;
    latestExpenseAt: string | null;
  }>;
};

async function authenticatedRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredAuthToken();

  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string" ? data.message : "Request failed.",
    );
  }

  return data as T;
}

export async function fetchDashboardSummary(month?: string) {
  const query = month ? `?month=${month}` : "";
  return authenticatedRequest<DashboardSummary>(`/dashboard/summary${query}`);
}

export async function fetchMonthlyReports() {
  return authenticatedRequest<{ reports: MonthlyReport[] }>("/dashboard/reports");
}

export async function fetchExpenses(queryString = "") {
  return authenticatedRequest<{ expenses: Expense[] }>(
    `/expenses${queryString ? `?${queryString}` : ""}`,
  );
}

export async function createExpense(payload: {
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes: string;
}) {
  return authenticatedRequest<{ message: string; expense: Expense }>("/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  id: string,
  payload: {
    amount: number;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
  },
) {
  return authenticatedRequest<{ message: string; expense: Expense }>(
    `/expenses/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteExpense(id: string) {
  return authenticatedRequest<{ message: string }>(`/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function fetchBudgets(month: string) {
  return authenticatedRequest<{ budgets: Budget[] }>(`/budgets?month=${month}`);
}

export async function upsertBudget(payload: {
  category: string;
  month: string;
  limit: number;
}) {
  return authenticatedRequest<{ message: string; budget: Budget }>("/budgets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteBudget(category: string, month: string) {
  return authenticatedRequest<{ message: string }>(
    `/budgets/${encodeURIComponent(category)}?month=${month}`,
    {
      method: "DELETE",
    },
  );
}

export async function fetchAdminOverview(month: string) {
  return authenticatedRequest<AdminOverview>(`/admin/overview?month=${month}`);
}
