import express from 'express';
import { getInsights } from '../controllers/adminController.js';
import { adminOnly, protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/insights', protect, adminOnly, getInsights);

export default router;