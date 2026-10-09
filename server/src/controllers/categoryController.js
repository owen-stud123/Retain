import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Expense from '../models/Expense.js';

function ensureCategoryId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid category id');
    error.statusCode = 400;
    throw error;
  }
}

export async function getCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
}

export async function createCategory(req, res) {
  const name = req.body.name?.trim();

  if (!name) {
    const error = new Error('Category name is required');
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.create({ name });
  res.status(201).json(category);
}

export async function updateCategory(req, res) {
  ensureCategoryId(req.params.id);
  const category = await Category.findById(req.params.id);

  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (category.isDefault) {
    const error = new Error('Uncategorized cannot be renamed');
    error.statusCode = 400;
    throw error;
  }

  const name = req.body.name?.trim();

  if (!name) {
    const error = new Error('Category name is required');
    error.statusCode = 400;
    throw error;
  }

  category.name = name;
  await category.save();
  res.json(category);
}

export async function deleteCategory(req, res) {
  ensureCategoryId(req.params.id);
  const category = await Category.findById(req.params.id);

  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }

  if (category.isDefault) {
    const error = new Error('Uncategorized cannot be deleted');
    error.statusCode = 400;
    throw error;
  }

  const uncategorized = await Category.findOne({ isDefault: true });
  const reassignedExpenses = await Expense.countDocuments({ category: category._id });
  await Expense.updateMany(
    { category: category._id },
    { $set: { category: uncategorized._id } }
  );
  await category.deleteOne();

  res.json({ message: 'Category deleted', reassignedExpenses });
}