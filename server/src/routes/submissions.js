import { Router } from 'express';
import {
  submitTask,
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  deleteSubmission,
} from '../controllers/submissionController.js';
import { dynamicFileUpload } from '../middleware/uploadMiddleware.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';

const router = Router();

// --- Public/Member Submission Entrypoint ---
// Accepts both application/json and multipart/form-data with file attachments
router.post('/task/:taskId', dynamicFileUpload, submitTask);

// --- Admin Submission Management Endpoints ---
router.get('/admin', requireAuth, requireAdmin, getSubmissions);
router.get('/admin/:id', requireAuth, requireAdmin, getSubmissionById);
router.patch('/admin/:id/status', requireAuth, requireAdmin, updateSubmissionStatus);
router.delete('/admin/:id', requireAuth, requireAdmin, deleteSubmission);

export default router;
