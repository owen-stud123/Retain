import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';
import { formatBudgetResponse } from '../utils/budget.js';
import { getCurrentMonth, getMonthDateRange, isValidMonth } from '../utils/month.js';

export async function getDashboard(req, res) {
  const month = req.query.month || getCurrentMonth();

  if (!isValidMonth(month)) {
    const error = new Error('Month must use YYYY-MM format');
    error.statusCode = 400;
    throw error;
  }

  const { start, end } = getMonthDateRange(month);
  const userFilter = { user: req.user._id, date: { $gte: start, $lt: end } };
  const [summary, highestExpense, byCategory, recentExpenses, budget] = await Promise.all([
    Expense.aggregate([
      { $match: userFilter },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]),
    Expense.findOne(userFilter).sort({ amount: -1 }).populate('category', 'name'),
    Expense.aggregate([
      { $match: userFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, categoryId: '$_id', name: '$category.name', total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]),
    Expense.find(userFilter).sort({ date: -1 }).limit(5).populate('category', 'name'),
    Budget.findOne({ user: req.user._id, month })
  ]);

  const totalSpent = summary[0]?.totalSpent || 0;
  const budgetData = formatBudgetResponse(month, budget?.amount || 0, totalSpent);

  res.json({
    month,
    totalSpent,
    budget: budgetData,
    highestExpense,
    byCategory,
    recentExpenses
  });
}