import { env } from "../config/env.js";

function createFallbackSuggestions(expenses) {
  if (!expenses.length) {
    return [
      "Start adding expenses for the last 30 days to unlock personalized spending suggestions.",
    ];
  }

  const categoryTotals = new Map();
  const paymentMethodTotals = new Map();
  const newestDate = new Date(
    Math.max(...expenses.map((expense) => new Date(expense.date).getTime())),
  );
  const recentWindowStart = new Date(newestDate);
  recentWindowStart.setDate(recentWindowStart.getDate() - 15);

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

  const sortedCategories = [...categoryTotals.entries()].sort(
    (left, right) => right[1] - left[1],
  );
  const suggestions = [];

  if (sortedCategories[0]) {
    suggestions.push(
      `You're spending a lot on ${sortedCategories[0][0]}. Try reducing it by 10-15% next month.`,
    );
  }

  const recentCategoryTotals = new Map();
  const earlierCategoryTotals = new Map();

  for (const expense of expenses) {
    const expenseDate = new Date(expense.date);
    const targetMap =
      expenseDate >= recentWindowStart ? recentCategoryTotals : earlierCategoryTotals;

    targetMap.set(
      expense.category,
      (targetMap.get(expense.category) || 0) + expense.amount,
    );
  }

  for (const [category, recentTotal] of recentCategoryTotals.entries()) {
    const earlierTotal = earlierCategoryTotals.get(category) || 0;

    if (recentTotal > earlierTotal * 1.4 && recentTotal - earlierTotal > 500) {
      suggestions.push(`${category} expenses increased a lot in the last two weeks.`);
      break;
    }
  }

  const topPaymentMethod = [...paymentMethodTotals.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0];

  if (topPaymentMethod) {
    suggestions.push(
      `${topPaymentMethod[0]} is your most-used payment method recently. Review whether it matches your budgeting goals.`,
    );
  }

  return suggestions.slice(0, 3);
}

export async function getSmartSuggestions(expenses) {
  try {
    const response = await fetch(`${env.pythonServiceUrl}/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expenses }),
    });

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        return data.suggestions;
      }
    }
  } catch {
    // Fall back to local suggestions when the Python service is unavailable.
  }

  return createFallbackSuggestions(expenses);
}
