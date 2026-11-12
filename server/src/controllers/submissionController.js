import { supabaseAdmin } from '../config/supabase.js';
import {
  validateMemberIdentification,
  validateSubmissionAgainstSchema,
  VALID_SUBMISSION_STATUSES,
} from '../services/schemaValidator.js';
import {
  uploadSubmissionFile,
  createSignedDownloadUrl,
  deleteSubmissionFile,
} from '../services/storageService.js';

/**
 * Public/Member: Submit answers for a published weekly task
 * Supports both application/json and multipart/form-data (with file attachments)
 */
export async function submitTask(req, res, next) {
  try {
    const { taskId } = req.params;

    // 1. Fetch the target task and its active schema
    const { data: task, error: taskError } = await supabaseAdmin
      .from('weekly_tasks')
      .select('id, title, status, deadline, allow_late_submissions, submission_schema')
      .eq('id', taskId)
      .maybeSingle();

    if (taskError) {
      return res.status(500).json({ success: false, error: taskError.message });
    }

    if (!task) {
      return res.status(404).json({ success: false, error: 'Target task not found.' });
    }

    // Security Check: Task must be published
    if (task.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'Submissions are closed. This task is not currently published.',
      });
    }

    // Security Check: Task deadline enforcement (permits late submissions only if admin enabled)
    const deadlineTime = new Date(task.deadline).getTime();
    const isLate = Date.now() > deadlineTime;
    if (isLate && !task.allow_late_submissions) {
      return res.status(400).json({
        success: false,
        error: `Submission deadline passed on ${new Date(task.deadline).toLocaleString('en-IN')}. Late submissions are not permitted.`,
        code: 'DEADLINE_PASSED',
      });
    }

    // 2. Validate Standard Member Identification Fields
    const memberValidation = validateMemberIdentification(req.body);
    if (!memberValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Standard member identification validation failed.',
        details: memberValidation.errors,
      });
    }

    // 3. Duplicate Prevention: Stable email identifier check
    const { data: existingSubmission, error: dupCheckError } = await supabaseAdmin
      .from('task_submissions')
      .select('id, submitted_at')
      .eq('task_id', taskId)
      .eq('member_email', memberValidation.data.member_email)
      .maybeSingle();

    if (dupCheckError) {
      console.warn('[DUPLICATE CHECK WARNING]:', dupCheckError.message);
    }

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        error: `Duplicate submission detected: A response from ${memberValidation.data.member_email} was already received on ${new Date(existingSubmission.submitted_at).toLocaleString('en-IN')}. Multiple submissions for the same task are not permitted.`,
        code: 'DUPLICATE_SUBMISSION',
      });
    }

    // 4. Parse dynamic submission data from body
    let rawSubmissionData = {};
    if (typeof req.body.submission_data === 'string') {
      try {
        rawSubmissionData = JSON.parse(req.body.submission_data);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'submission_data must be a valid JSON string or object.',
        });
      }
    } else if (typeof req.body.submission_data === 'object' && req.body.submission_data !== null) {
      rawSubmissionData = req.body.submission_data;
    } else {
      // In multipart form-data, fields may be sent directly at root
      rawSubmissionData = { ...req.body };
      delete rawSubmissionData.member_name;
      delete rawSubmissionData.member_email;
      delete rawSubmissionData.email;
      delete rawSubmissionData.department;
      delete rawSubmissionData.year;
      delete rawSubmissionData.section;
      delete rawSubmissionData.club_domain;
    }

    // 4. Map uploaded files (if any) from Multer
    const uploadedFilesMap = {};
    const filesToUploadToStorage = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        uploadedFilesMap[file.fieldname] = file;
        filesToUploadToStorage.push({ fieldId: file.fieldname, file });
      }
    }

    // 5. Validate dynamic answers against task's active submission_schema
    const dynamicValidation = validateSubmissionAgainstSchema(
      task.submission_schema || [],
      rawSubmissionData,
      uploadedFilesMap
    );

    if (!dynamicValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Dynamic task submission validation failed.',
        details: dynamicValidation.errors,
      });
    }

    const finalSubmissionData = { ...dynamicValidation.sanitizedData };

    // 6. Upload any verified files to dedicated Supabase Storage bucket
    for (const item of filesToUploadToStorage) {
      try {
        const metadata = await uploadSubmissionFile(item.file, taskId, item.fieldId);
        finalSubmissionData[item.fieldId] = metadata;
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          error: `Storage upload failed for field '${item.fieldId}': ${uploadErr.message}`,
        });
      }
    }

    // 7. Insert submission record into task_submissions
    const submissionRecord = {
      task_id: taskId,
      member_name: memberValidation.data.member_name,
      member_email: memberValidation.data.member_email,
      department: memberValidation.data.department,
      year: memberValidation.data.year,
      section: memberValidation.data.section,
      club_domain: memberValidation.data.club_domain,
      submission_data: finalSubmissionData,
      schema_snapshot: task.submission_schema || [],
      submission_status: 'submitted',
    };

    const { data: saved, error: insertError } = await supabaseAdmin
      .from('task_submissions')
      .insert(submissionRecord)
      .select('id, task_id, member_name, member_email, department, year, section, club_domain, submitted_at, submission_status')
      .single();

    if (insertError) {
      return res.status(500).json({ success: false, error: insertError.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Task submission received and recorded successfully.',
      data: saved,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Get all member submissions with filtering & pagination
 * Query params: taskId, domain, year, status, page, limit
 */
export async function getSubmissions(req, res, next) {
  try {
    const {
      taskId,
      domain,
      year,
      department,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('task_submissions')
      .select('*, weekly_tasks(title, assigned_domain, week_number)', { count: 'exact' });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    if (domain && domain !== 'All') {
      query = query.eq('club_domain', domain);
    }
    if (year) {
      query = query.eq('year', year);
    }
    if (department) {
      query = query.ilike('department', `%${department}%`);
    }
    if (status && VALID_SUBMISSION_STATUSES.includes(status)) {
      query = query.eq('submission_status', status);
    }

    query = query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: submissions, count, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil((count || 0) / limitNum),
      },
      data: submissions,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Get a single submission by ID with secure signed URLs for any stored files
 */
export async function getSubmissionById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: submission, error } = await supabaseAdmin
      .from('task_submissions')
      .select('*, weekly_tasks(id, title, assigned_domain, week_number, deadline, submission_schema)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    // Generate signed URLs for any file_upload fields in submission_data
    const enrichedData = { ...submission.submission_data };

    if (submission.weekly_tasks && Array.isArray(submission.weekly_tasks.submission_schema)) {
      for (const field of submission.weekly_tasks.submission_schema) {
        if (field.type === 'file_upload' && enrichedData[field.id]) {
          const fileMeta = enrichedData[field.id];
          if (fileMeta && fileMeta.storage_path) {
            try {
              const signedUrl = await createSignedDownloadUrl(fileMeta.storage_path, 3600);
              enrichedData[field.id] = {
                ...fileMeta,
                download_url: signedUrl,
              };
            } catch (signErr) {
              console.warn(`[SIGN URL ERROR] Field: ${field.id}:`, signErr.message);
            }
          }
        }
      }
    }

    return res.json({
      success: true,
      data: {
        ...submission,
        submission_data: enrichedData,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Update submission review status
 */
export async function updateSubmissionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_SUBMISSION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${VALID_SUBMISSION_STATUSES.join(', ')}.`,
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('task_submissions')
      .update({ submission_status: status })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Submission not found.' });
    }

    return res.json({
      success: true,
      message: `Submission status updated to '${status}'.`,
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Delete a submission and clean up its storage files
 */
export async function deleteSubmission(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch submission first to find files to delete
    const { data: submission } = await supabaseAdmin
      .from('task_submissions')
      .select('submission_data')
      .eq('id', id)
      .maybeSingle();

    if (submission && submission.submission_data) {
      for (const val of Object.values(submission.submission_data)) {
        if (val && typeof val === 'object' && val.storage_path) {
          await deleteSubmissionFile(val.storage_path);
        }
      }
    }

    const { error } = await supabaseAdmin
      .from('task_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: 'Submission and associated files deleted successfully.',
    });
  } catch (err) {
    return next(err);
  }
}
