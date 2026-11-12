import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// --- Public Endpoints ---
router.get('/', getProjects);
router.get('/:id', getProjectById);

// --- Admin Endpoints ---
router.post('/admin', requireAuth, requireAdmin, createProject);
router.put('/admin/:id', requireAuth, requireAdmin, updateProject);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteProject);

export default router;
