import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { getCurrentMonth, getMonthDateRange } from '../utils/month.js';

export async function getInsights(req, res) {
  const month = getCurrentMonth();
  const { start, end } = getMonthDateRange(month);
  const [userStats, expenseStats, expensesThisMonth, spendingPerCategory, categories, recentExpenses, recentUsers] = await Promise.all([
    User.countDocuments(),
    Expense.aggregate([
      { $group: { _id: null, totalExpenses: { $sum: 1 }, totalExpenseValue: { $sum: '$amount' } } }
    ]),
    // Counts expenses dated this month, matching how the user dashboard defines a month.
    Expense.countDocuments({ date: { $gte: start, $lt: end } }),
    Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, categoryId: '$_id', name: '$category.name', total: 1, count: 1 } },
      { $sort: { total: -1 } }
    ]),
    Category.find().sort({ name: 1 }),
    Expense.find().sort({ createdAt: -1 }).limit(5)
      .populate('category', 'name')
      .populate('user', 'name email'),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt')
  ]);

  const categoryUsage = new Map(spendingPerCategory.map((item) => [item.categoryId.toString(), item]));
  const allCategories = categories.map((category) => {
    const usage = categoryUsage.get(category._id.toString());
    return {
      categoryId: category._id,
      name: category.name,
      total: usage?.total || 0,
      count: usage?.count || 0
    };
  });
  const topCategories = [...allCategories].sort((a, b) => b.count - a.count || b.total - a.total).slice(0, 5);
  const bottomCategories = [...allCategories].sort((a, b) => a.count - b.count || a.total - b.total).slice(0, 5);
  const stats = expenseStats[0] || { totalExpenses: 0, totalExpenseValue: 0 };

  res.json({
    totalUsers: userStats,
    totalExpenses: stats.totalExpenses,
    totalExpenseValue: stats.totalExpenseValue,
    expensesThisMonth,
    spendingPerCategory: allCategories,
    topCategories,
    bottomCategories,
    recentExpenses,
    recentUsers
  });
}