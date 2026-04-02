export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeMonth(value) {
  const text = normalizeText(value);

  if (/^\d{4}-\d{2}$/.test(text)) {
    return text;
  }

  return "";
}

export function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthRange(monthKey) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);

  return { start, end };
}
