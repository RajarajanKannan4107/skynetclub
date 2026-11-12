import { Router } from 'express';
import {
  getPublishedTasks,
  getTaskById,
  getAllTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// --- Public Endpoints ---
router.get('/', getPublishedTasks);
router.get('/:id', optionalAuth, getTaskById);

// --- Admin Endpoints ---
router.get('/admin/all', requireAuth, requireAdmin, getAllTasks);
router.post('/admin', requireAuth, requireAdmin, createTask);
router.put('/admin/:id', requireAuth, requireAdmin, updateTask);
router.patch('/admin/:id/status', requireAuth, requireAdmin, updateTaskStatus);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteTask);

export default router;
