import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import { escapeRegex, httpError, isDateOnly, isNonEmptyString, parseDate, parseNumber } from '../utils/validation.js';

const allowedFields = ['title', 'amount', 'category', 'date', 'paymentMethod', 'notes'];
const paymentMethods = ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'];
const MAX_TITLE_LENGTH = 120;
const MAX_NOTES_LENGTH = 1000;

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
  if (!partial && (!isNonEmptyString(data.title) || data.amount === undefined || !data.category || !data.date || !data.paymentMethod)) {
    throw httpError('Title, amount, category, date and payment method are required');
  }

  if (data.title !== undefined) {
    if (!isNonEmptyString(data.title)) throw httpError('Title is required');
    if (data.title.trim().length > MAX_TITLE_LENGTH) throw httpError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }

  if (data.amount !== undefined) {
    const amount = parseNumber(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw httpError('Amount must be greater than 0');
  }

  if (data.paymentMethod !== undefined && !paymentMethods.includes(data.paymentMethod)) {
    throw httpError('Invalid payment method');
  }

  if (data.date !== undefined) {
    parseDate(data.date, 'Date');
  }

  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') throw httpError('Notes must be text');
    if (data.notes.trim().length > MAX_NOTES_LENGTH) throw httpError(`Notes must be ${MAX_NOTES_LENGTH} characters or fewer`);
  }
}

async function validateCategory(categoryId) {
  if (typeof categoryId !== 'string' || !mongoose.Types.ObjectId.isValid(categoryId)) {
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

// Reads a single query-string value; repeated parameters (?a=1&a=2) are rejected.
function getQueryValue(query, key) {
  const value = query[key];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') throw httpError(`Invalid ${key} parameter`);
  return value;
}

function parseAmountParam(value, key) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw httpError(`${key} must be a number of zero or more`);
  return amount;
}

export async function getExpenses(req, res) {
  const search = getQueryValue(req.query, 'search');
  const category = getQueryValue(req.query, 'category');
  const paymentMethod = getQueryValue(req.query, 'paymentMethod');
  const startDate = getQueryValue(req.query, 'startDate');
  const endDate = getQueryValue(req.query, 'endDate');
  const minAmount = getQueryValue(req.query, 'minAmount');
  const maxAmount = getQueryValue(req.query, 'maxAmount');
  const sortBy = getQueryValue(req.query, 'sortBy') || 'date';
  const order = getQueryValue(req.query, 'order') || 'desc';
  const page = Math.max(Number.parseInt(getQueryValue(req.query, 'page'), 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(getQueryValue(req.query, 'limit'), 10) || 10, 1), 100);
  const filter = { user: req.user._id };

  if (search?.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) throw httpError('Invalid category id');
    filter.category = category;
  }
  if (paymentMethod) {
    if (!paymentMethods.includes(paymentMethod)) throw httpError('Invalid payment method');
    filter.paymentMethod = paymentMethod;
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = parseDate(startDate, 'startDate');
    if (endDate) {
      const end = parseDate(endDate, 'endDate');
      if (isDateOnly(endDate)) {
        // A plain YYYY-MM-DD end date includes the whole day.
        end.setUTCDate(end.getUTCDate() + 1);
        filter.date.$lt = end;
      } else {
        filter.date.$lte = end;
      }
    }
  }
  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.amount = {};
    if (minAmount !== undefined) filter.amount.$gte = parseAmountParam(minAmount, 'minAmount');
    if (maxAmount !== undefined) filter.amount.$lte = parseAmountParam(maxAmount, 'maxAmount');
  }

  const sortField = sortBy === 'amount' ? 'amount' : 'date';
  const sortOrder = order === 'asc' ? 1 : -1;
  const total = await Expense.countDocuments(filter);
  const items = await Expense.find(filter)
    .populate('category', 'name')
    // _id is a tie-breaker so records with equal dates or amounts keep a stable order across pages.
    .sort({ [sortField]: sortOrder, _id: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function createExpense(req, res) {
  const data = getExpenseData(req.body);
  validateExpenseData(data);
  await validateCategory(data.category);
  data.title = data.title.trim();
  data.amount = parseNumber(data.amount);
  if (typeof data.notes === 'string') data.notes = data.notes.trim();

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
  if (data.amount !== undefined) data.amount = parseNumber(data.amount);
  if (typeof data.notes === 'string') data.notes = data.notes.trim();

  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    data,
    { returnDocument: 'after', runValidators: true }
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