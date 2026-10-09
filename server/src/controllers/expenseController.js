import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';

const allowedFields = ['title', 'amount', 'category', 'date', 'paymentMethod', 'notes'];
const paymentMethods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'];

function ensureExpenseId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid expense id');
    error.statusCode = 400;
    throw error;
  }
}

function getExpenseData(body) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]])
  );
}

function validateExpenseData(data, partial = false) {
  if (!partial && (!data.title?.trim() || data.amount === undefined || !data.category || !data.date || !data.paymentMethod)) {
    const error = new Error('Title, amount, category, date and payment method are required');
    error.statusCode = 400;
    throw error;
  }

  if (data.title !== undefined && !data.title?.trim()) {
    const error = new Error('Title is required');
    error.statusCode = 400;
    throw error;
  }

  if (data.amount !== undefined && (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0)) {
    const error = new Error('Amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

  if (data.paymentMethod !== undefined && !paymentMethods.includes(data.paymentMethod)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 400;
    throw error;
  }

  if (data.date !== undefined && Number.isNaN(new Date(data.date).getTime())) {
    const error = new Error('Invalid date');
    error.statusCode = 400;
    throw error;
  }
}

async function validateCategory(categoryId) {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    const error = new Error('Invalid category id');
    error.statusCode = 400;
    throw error;
  }

  if (!await Category.exists({ _id: categoryId })) {
    const error = new Error('Category not found');
    error.statusCode = 400;
    throw error;
  }
}

export async function getExpenses(req, res) {
  const {
    search,
    category,
    paymentMethod,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy = 'date',
    order = 'desc'
  } = req.query;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
  const filter = { user: req.user._id };

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }
  if (category) filter.category = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  const sortField = sortBy === 'amount' ? 'amount' : 'date';
  const sortOrder = order === 'asc' ? 1 : -1;
  const total = await Expense.countDocuments(filter);
  const items = await Expense.find(filter)
    .populate('category', 'name')
    .sort({ [sortField]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function createExpense(req, res) {
  const data = getExpenseData(req.body);
  validateExpenseData(data);
  await validateCategory(data.category);
  data.title = data.title.trim();
  data.amount = Number(data.amount);

  const expense = await Expense.create({ ...data, user: req.user._id });
  res.status(201).json(await expense.populate('category', 'name'));
}

export async function getExpense(req, res) {
  ensureExpenseId(req.params.id);
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate('category', 'name');

  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }

  res.json(expense);
}

export async function updateExpense(req, res) {
  ensureExpenseId(req.params.id);
  const data = getExpenseData(req.body);
  validateExpenseData(data, true);
  if (data.category) await validateCategory(data.category);
  if (data.title) data.title = data.title.trim();
  if (data.amount !== undefined) data.amount = Number(data.amount);

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    data,
    { new: true, runValidators: true }
  ).populate('category', 'name');

  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }

  res.json(expense);
}

export async function deleteExpense(req, res) {
  ensureExpenseId(req.params.id);
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({ message: 'Expense deleted' });
}