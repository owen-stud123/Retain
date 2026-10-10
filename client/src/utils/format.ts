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