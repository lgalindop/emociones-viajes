/**
 * Date Utilities for México Timezone-Safe Operations
 *
 * This module provides utilities for handling dates correctly in México timezone (UTC-6/UTC-7).
 *
 * CRITICAL ISSUE:
 * Using new Date().toISOString().split("T")[0] returns UTC date, which can be
 * TOMORROW in México after ~6 PM local time. This causes dates to shift by one day.
 *
 * Example:
 *   Local time (México): 2026-01-09 19:00 (7 PM)
 *   UTC time:            2026-01-10 01:00 (next day!)
 *   toISOString():       "2026-01-10T01:00:00.000Z"
 *   split("T")[0]:       "2026-01-10" ❌ WRONG!
 *
 * SOLUTION:
 * Always use getLocalDateString() to get today's date as YYYY-MM-DD string.
 * This function uses getFullYear(), getMonth(), getDate() which respect local timezone.
 *
 * @module dateUtils
 */

/**
 * Get date string in local timezone as YYYY-MM-DD format.
 *
 * This is the SAFE way to get today's date for México timezone.
 * Use this instead of: new Date().toISOString().split("T")[0]
 *
 * @param {Date} [date=new Date()] - Date object to convert (defaults to now)
 * @returns {string} Date string in YYYY-MM-DD format (e.g., "2026-01-09")
 *
 * @example
 * // Get today's date
 * const today = getLocalDateString();
 * // "2026-01-09"
 *
 * @example
 * // Get specific date
 * const specificDate = getLocalDateString(new Date(2026, 0, 15));
 * // "2026-01-15"
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string safely for local timezone interpretation.
 *
 * Adds "T00:00:00" to ensure the date is interpreted as midnight local time,
 * not midnight UTC. This prevents timezone shifts when displaying dates.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format (or with time component)
 * @returns {Date|null} Date object with time set to 00:00:00 local time, or null if invalid
 *
 * @example
 * // Parse a database date string
 * const date = parseLocalDate("2026-01-09");
 * // Returns Date object representing Jan 9, 2026 at 00:00:00 local time
 *
 * @example
 * // Handles ISO strings too
 * const date = parseLocalDate("2026-01-09T15:30:00Z");
 * // Returns Date object representing Jan 9, 2026 at 00:00:00 local time
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const date = new Date(dateOnly + "T00:00:00");
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a date string for display in México Spanish locale.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {('short'|'long'|'medium')} [format='long'] - Display format
 *   - 'short': 09/01/2026
 *   - 'medium': 09 ene 2026
 *   - 'long': 9 de enero de 2026
 * @returns {string} Formatted date string or "por confirmar" if invalid
 *
 * @example
 * formatDate("2026-01-09", "short");
 * // "09/01/2026"
 *
 * @example
 * formatDate("2026-01-09", "long");
 * // "9 de enero de 2026"
 */
export function formatDate(dateStr, format = 'long') {
  const date = parseLocalDate(dateStr);
  if (!date) return "por confirmar";

  if (format === 'short') {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (format === 'medium') {
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Check if a date is in the past (before today, ignoring time).
 *
 * Useful for determining if a payment is overdue or an event has passed.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is before today
 *
 * @example
 * isPastDate("2025-12-31");
 * // true (if today is 2026-01-09)
 *
 * @example
 * isPastDate("2026-01-15");
 * // false (if today is 2026-01-09)
 */
export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const date = parseLocalDate(dateStr);
  if (!date) return false;

  const today = parseLocalDate(getLocalDateString());
  return date < today;
}

/**
 * Check if a date string represents today.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is today
 *
 * @example
 * isToday("2026-01-09");
 * // true (if today is 2026-01-09)
 *
 * @example
 * isToday("2026-01-10");
 * // false (if today is 2026-01-09)
 */
export function isToday(dateStr) {
  if (!dateStr) return false;
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  return dateOnly === getLocalDateString();
}

/**
 * Get the current year.
 *
 * Simple helper for receipt number generation and other year-based operations.
 *
 * @returns {number} Current year (e.g., 2026)
 *
 * @example
 * const year = getCurrentYear();
 * // 2026
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Format date for informal receipts (split into components).
 *
 * Returns an object with day, month (abbreviated uppercase), and year.
 * Used specifically for the informal receipt template.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {{day: string|number, month: string, year: string|number}} Date components or empty strings if invalid
 *
 * @example
 * formatDateInformal("2026-01-09");
 * // { day: 9, month: "ENE", year: 2026 }
 */
export function formatDateInformal(dateStr) {
  const date = parseLocalDate(dateStr);
  if (!date) return { day: "", month: "", year: "" };

  const day = date.getDate();
  const month = date
    .toLocaleDateString("es-MX", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const year = date.getFullYear();

  return { day, month, year };
}

/**
 * Format date for professional receipts (short format).
 *
 * Returns date in DD/MM/YYYY format for professional receipt template.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Date in DD/MM/YYYY format or empty string if invalid
 *
 * @example
 * formatDateShort("2026-01-09");
 * // "09/01/2026"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = dateOnly.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

/**
 * Format date for professional receipts (long format).
 *
 * Returns date in Spanish long format: "9 de enero de 2026".
 * Used for professional receipt template.
 *
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Date in long Spanish format or empty string if invalid
 *
 * @example
 * formatDateLong("2026-01-09");
 * // "9 de enero de 2026"
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = dateOnly.split("-");
  if (!year || !month || !day) return "";

  const monthNames = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const monthIndex = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} de ${monthNames[monthIndex]} de ${year}`;
}

/**
 * EXPORTED FUNCTIONS SUMMARY:
 *
 * Core Functions:
 * - getLocalDateString(date) - Get YYYY-MM-DD string in local timezone ⭐ MOST IMPORTANT
 * - parseLocalDate(dateStr) - Parse date string safely for local timezone
 * - formatDate(dateStr, format) - Format date for display (short/medium/long)
 *
 * Comparison Functions:
 * - isPastDate(dateStr) - Check if date is before today
 * - isToday(dateStr) - Check if date is today
 *
 * Helper Functions:
 * - getCurrentYear() - Get current year
 *
 * Receipt-Specific Functions:
 * - formatDateInformal(dateStr) - Format for informal receipts
 * - formatDateShort(dateStr) - Format as DD/MM/YYYY
 * - formatDateLong(dateStr) - Format as "D de mes de YYYY"
 */
