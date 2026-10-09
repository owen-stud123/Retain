export function getBudgetStatus(percentUsed) {
  if (percentUsed > 100) {
    return 'over';
  }

  if (percentUsed >= 80) {
    return 'approaching';
  }

  return 'within';
}

export function formatBudgetResponse(month, amount, spent) {
  const remaining = amount - spent;
  const percentUsed = amount > 0 ? (spent / amount) * 100 : 0;

  return {
    month,
    amount,
    spent,
    remaining,
    percentUsed,
    status: getBudgetStatus(percentUsed)
  };
}