from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)


def _normalize_expenses(expenses):
    if not expenses:
        return pd.DataFrame()

    frame = pd.DataFrame(expenses)

    required_columns = {"amount", "category", "date", "paymentMethod"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        raise ValueError(f"Missing required fields: {', '.join(sorted(missing_columns))}")

    frame = frame.copy()
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce", utc=True)
    frame["category"] = frame["category"].fillna("Other").astype(str).str.strip()
    frame["paymentMethod"] = frame["paymentMethod"].fillna("Unknown").astype(str).str.strip()

    frame = frame.dropna(subset=["amount", "date"])
    frame = frame[frame["amount"] > 0]
    if frame.empty:
        return frame

    latest_date = frame["date"].max()
    cutoff = latest_date - pd.Timedelta(days=30)
    return frame[frame["date"] >= cutoff].copy()


def build_suggestions(expenses):
    if not expenses:
        return [
            "Start adding expenses for the last 30 days to unlock smart budget suggestions."
        ]

    frame = _normalize_expenses(expenses)
    if frame.empty:
        return [
            "No expenses were found in the last 30 days. Add recent activity to get suggestions."
        ]

    suggestions = []
    category_totals = frame.groupby("category")["amount"].sum().sort_values(ascending=False)
    total_spend = float(frame["amount"].sum())

    if not category_totals.empty and total_spend > 0:
        top_category = category_totals.index[0]
        top_amount = float(category_totals.iloc[0])
        top_share = (top_amount / total_spend) * 100
        reduction_target = top_amount * 0.15
        if top_share >= 25 or top_amount >= 2500:
            suggestions.append(
                f"You're spending a lot on {top_category}. Try to reduce it by 15% (about Rs. {reduction_target:.0f})."
            )

    midpoint = frame["date"].max() - pd.Timedelta(days=15)
    recent = frame[frame["date"] >= midpoint]
    earlier = frame[frame["date"] < midpoint]

    if not recent.empty and not earlier.empty:
        recent_totals = recent.groupby("category")["amount"].sum()
        earlier_totals = earlier.groupby("category")["amount"].sum()

        growth_candidates = []
        for category, recent_amount in recent_totals.items():
            earlier_amount = float(earlier_totals.get(category, 0))
            if recent_amount >= 1000 and recent_amount > max(earlier_amount * 1.4, earlier_amount + 500):
                growth_candidates.append((category, recent_amount - earlier_amount))

        if growth_candidates:
            growth_candidates.sort(key=lambda item: item[1], reverse=True)
            boosted_category = growth_candidates[0][0]
            suggestions.append(
                f"Your {boosted_category.lower()} expenses increased a lot this month. Review recent purchases in that category."
            )

    weekday_totals = (
        frame.assign(weekday=frame["date"].dt.day_name())
        .groupby("weekday")["amount"]
        .sum()
        .reindex(
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            fill_value=0,
        )
    )
    if weekday_totals.max() > 0:
        top_day = weekday_totals.idxmax()
        if weekday_totals.loc[top_day] >= total_spend * 0.25:
            suggestions.append(
                f"You tend to spend the most on {top_day}s. Planning purchases before that day may help control your budget."
            )

    payment_totals = frame.groupby("paymentMethod")["amount"].sum().sort_values(ascending=False)
    if not payment_totals.empty:
        top_method = payment_totals.index[0]
        top_method_amount = float(payment_totals.iloc[0])
        if top_method_amount >= total_spend * 0.4:
            suggestions.append(
                f"{top_method} is your most-used payment method in the last 30 days. Review whether it aligns with your monthly budget."
            )

    if not suggestions:
        suggestions.append(
            "Your recent spending looks fairly balanced. Keep tracking expenses daily to spot changes early."
        )

    return suggestions[:4]


@app.post("/suggestions")
def suggestions():
    payload = request.get_json(silent=True) or {}
    expenses = payload.get("expenses", [])

    try:
        suggestions = build_suggestions(expenses)
        return jsonify({"suggestions": suggestions, "count": len(suggestions)})
    except ValueError as error:
        return jsonify({"message": str(error), "suggestions": []}), 400


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
