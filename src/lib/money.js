// lib/money.js
export function formatMoneyDisplay(value, currency = "MXN") {
  if (value === null || value === undefined || value === "") return "";
  const n =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^0-9.-]+/g, ""));
  if (isNaN(n)) return "";
  const locales = "es-MX";
  const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  let symbol = currency === "USD" ? "US$" : currency === "EUR" ? "€" : "$";
  return symbol + " " + n.toLocaleString(locales, opts);
}

export function parseMoneyToNumber(formatted) {
  if (formatted === null || formatted === undefined || formatted === "")
    return null;
  const cleaned = String(formatted).replace(/[^0-9.-]+/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}
