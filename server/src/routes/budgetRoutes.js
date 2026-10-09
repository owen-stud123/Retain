import express from 'express';
import { getBudget, upsertBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/:month', getBudget);
router.put('/:month', upsertBudget);

export default router;