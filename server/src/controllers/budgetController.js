import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import { formatBudgetResponse } from '../utils/budget.js';
import { parseNumber } from '../utils/validation.js';
import { getCurrentMonth, getMonthDateRange, isValidMonth } from '../utils/month.js';

function ensureMonth(month) {
  if (!isValidMonth(month)) {
    const error = new Error('Month must use YYYY-MM format');
    error.statusCode = 400;
    throw error;
  }
}

async function getSpent(userId, month) {
  const { start, end } = getMonthDateRange(month);
  const [result] = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result?.total || 0;
}

export async function getBudget(req, res) {
  const month = req.params.month || getCurrentMonth();
  ensureMonth(month);
  const budget = await Budget.findOne({ user: req.user._id, month });
  const spent = await getSpent(req.user._id, month);
  res.json(formatBudgetResponse(month, budget?.amount || 0, spent));
}

export async function upsertBudget(req, res) {
  const { month } = req.params;
  ensureMonth(month);
  const amount = parseNumber(req.body?.amount);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error('Budget amount must be zero or greater');
    error.statusCode = 400;
    throw error;
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, month },
    { amount },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );
  const spent = await getSpent(req.user._id, month);
  res.json(formatBudgetResponse(month, budget.amount, spent));
}