import multer from 'multer';
import { config } from '../config/env.js';

// Use memory storage so we can validate file contents before sending to Supabase Storage
const storage = multer.memoryStorage();

const maxBytes = config.storage.maxFileSizeMb * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: maxBytes,
    files: 10,
  },
});

/**
 * Middleware handling any file fields submitted dynamically
 */
export const dynamicFileUpload = upload.any();
