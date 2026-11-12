import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';
import crypto from 'crypto';
import path from 'path';

/**
 * Uploads a file buffer directly to Supabase Storage using the service-role client.
 * Returns structured metadata to store inside submission_data JSONB.
 *
 * @param {object} file - Multer file object { buffer, originalname, mimetype, size }
 * @param {string} taskId - The ID of the task
 * @param {string} fieldId - The identifier of the dynamic form field
 * @returns {Promise<{ storage_path: string, file_name: string, mime_type: string, file_size: number, bucket: string }>}
 */
export async function uploadSubmissionFile(file, taskId, fieldId) {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object provided for upload.');
  }

  const bucket = config.storage.submissionsBucket;
  const fileExt = path.extname(file.originalname).toLowerCase();
  const safeBaseName = path
    .basename(file.originalname, fileExt)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  const uniqueHash = crypto.randomBytes(8).toString('hex');
  const storagePath = `tasks/${taskId}/${fieldId}/${Date.now()}_${uniqueHash}_${safeBaseName}${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(`[STORAGE UPLOAD ERROR] Bucket: ${bucket}, Path: ${storagePath}`, error);
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  return {
    bucket,
    storage_path: data.path,
    file_name: file.originalname,
    mime_type: file.mimetype,
    file_size: file.size,
    uploaded_at: new Date().toISOString(),
  };
}

/**
 * Creates a temporary signed URL for an authorized administrator to view/download private files.
 * @param {string} storagePath - Path inside task-submissions bucket
 * @param {number} expiresInSeconds - Lifetime of signed URL (default 3600 = 1 hour)
 * @returns {Promise<string>}
 */
export async function createSignedDownloadUrl(storagePath, expiresInSeconds = 3600) {
  const bucket = config.storage.submissionsBucket;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    throw new Error(`Could not generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Deletes a file from Supabase Storage (e.g. when a submission is deleted).
 * @param {string} storagePath - Path inside bucket
 * @returns {Promise<boolean>}
 */
export async function deleteSubmissionFile(storagePath) {
  const bucket = config.storage.submissionsBucket;
  const { error } = await supabaseAdmin.storage.from(bucket).remove([storagePath]);

  if (error) {
    console.warn(`[STORAGE DELETE WARNING] Path: ${storagePath}`, error.message);
    return false;
  }

  return true;
}
