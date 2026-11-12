import { Router } from 'express';
import { adminLogin, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Admin sign-in route
router.post('/admin-login', adminLogin);

// Verified profile & admin role check
router.get('/me', requireAuth, getMe);

export default router;
