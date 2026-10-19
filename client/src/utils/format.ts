export const CURRENCY = 'USD';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(new Date(value));
}

export function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function dateInputToUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

// Today's date and month in the user's own time zone (toISOString() would use UTC, which is
// the previous day between midnight and 02:00 in Kigali).
export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function currentMonthValue() {
  return todayInputValue().slice(0, 7);
}
