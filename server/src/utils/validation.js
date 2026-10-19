export function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Search text is matched literally, so characters like "(" or ".*" can't break or slow the query.
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === 'string' && emailPattern.test(value.trim());
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function isDateOnly(value) {
  return dateOnlyPattern.test(value);
}

// Returns a valid Date or throws a 400 error naming the field.
export function parseDate(value, field) {
  const date = new Date(value);
  if (typeof value !== 'string' || !value || Number.isNaN(date.getTime())) {
    throw httpError(`${field} must be a valid date`);
  }
  return date;
}

// Accepts numbers or numeric strings only; empty strings, null and booleans are rejected.
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return Number.NaN;
}
