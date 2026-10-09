import express from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '../controllers/categoryController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getCategories);
router.post('/', adminOnly, createCategory);
router.put('/:id', adminOnly, updateCategory);
router.delete('/:id', adminOnly, deleteCategory);

export default router;