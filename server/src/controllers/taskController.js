import { supabaseAdmin } from '../config/supabase.js';
import {
  validateSubmissionSchemaDefinition,
  VALID_TASK_DOMAINS,
  VALID_TASK_STATUSES,
} from '../services/schemaValidator.js';

/**
 * Public: Get all active published weekly tasks
 * Query params: domain (optional)
 */
export async function getPublishedTasks(req, res, next) {
  try {
    const { domain } = req.query;

    let query = supabaseAdmin
      .from('weekly_tasks')
      .select('id, title, description, assigned_domain, week_number, deadline, allow_late_submissions, status, submission_schema, created_at, updated_at')
      .eq('status', 'published')
      .order('deadline', { ascending: true });

    if (domain && domain !== 'All') {
      query = query.or(`assigned_domain.eq.${domain},assigned_domain.eq.All`);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Public/Admin: Get a single task by ID including its dynamic submission schema
 */
export async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabaseAdmin
      .from('weekly_tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // If task is not published, only admins can view it
    if (task.status !== 'published') {
      if (!req.user) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }

      // Check admin status
      const { data: adminRecord } = await supabaseAdmin
        .from('admin_roles')
        .select('id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (!adminRecord) {
        return res.status(404).json({ success: false, error: 'Task not found.' });
      }
    }

    return res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Get all tasks across all statuses (draft, published, archived)
 */
export async function getAllTasks(req, res, next) {
  try {
    const { status, domain, sort = 'created_at', order = 'desc' } = req.query;

    let query = supabaseAdmin
      .from('weekly_tasks')
      .select('*')
      .order(sort, { ascending: order === 'asc' });

    if (status && VALID_TASK_STATUSES.includes(status)) {
      query = query.eq('status', status);
    }

    if (domain && domain !== 'All') {
      query = query.eq('assigned_domain', domain);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Create a new weekly task with dynamic submission schema
 */
export async function createTask(req, res, next) {
  try {
    const {
      title,
      description,
      assigned_domain,
      week_number,
      deadline,
      allow_late_submissions = false,
      status = 'draft',
      submission_schema = [],
    } = req.body;

    const validationErrors = [];

    if (!title || typeof title !== 'string' || !title.trim()) {
      validationErrors.push('Task title is required.');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      validationErrors.push('Task description is required.');
    }
    if (!assigned_domain || !VALID_TASK_DOMAINS.includes(assigned_domain)) {
      validationErrors.push(`assigned_domain must be one of: ${VALID_TASK_DOMAINS.join(', ')}.`);
    }
    const parsedWeek = parseInt(week_number, 10);
    if (Number.isNaN(parsedWeek) || parsedWeek <= 0) {
      validationErrors.push('week_number must be a positive integer.');
    }
    if (!deadline || Number.isNaN(Date.parse(deadline))) {
      validationErrors.push('A valid deadline timestamp is required.');
    }
    if (status && !VALID_TASK_STATUSES.includes(status)) {
      validationErrors.push(`status must be one of: ${VALID_TASK_STATUSES.join(', ')}.`);
    }

    // Validate the submission_schema structure
    const schemaValidation = validateSubmissionSchemaDefinition(submission_schema);
    if (!schemaValidation.valid) {
      validationErrors.push(...schemaValidation.errors);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: validationErrors,
      });
    }

    const newTask = {
      title: title.trim(),
      description: description.trim(),
      assigned_domain,
      week_number: parsedWeek,
      deadline: new Date(deadline).toISOString(),
      allow_late_submissions: Boolean(allow_late_submissions),
      status,
      submission_schema,
      created_by: req.user.id,
    };

    const { data: created, error } = await supabaseAdmin
      .from('weekly_tasks')
      .insert(newTask)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Weekly task created successfully.',
      data: created,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Update an existing weekly task
 */
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      assigned_domain,
      week_number,
      deadline,
      status,
      submission_schema,
    } = req.body;

    const updates = {};
    const validationErrors = [];

    if (title !== undefined) {
      if (!title || !title.trim()) validationErrors.push('Title cannot be empty.');
      else updates.title = title.trim();
    }

    if (description !== undefined) {
      if (!description || !description.trim()) validationErrors.push('Description cannot be empty.');
      else updates.description = description.trim();
    }

    if (assigned_domain !== undefined) {
      if (!VALID_TASK_DOMAINS.includes(assigned_domain)) {
        validationErrors.push(`assigned_domain must be one of: ${VALID_TASK_DOMAINS.join(', ')}.`);
      } else {
        updates.assigned_domain = assigned_domain;
      }
    }

    if (week_number !== undefined) {
      const parsedWeek = parseInt(week_number, 10);
      if (Number.isNaN(parsedWeek) || parsedWeek <= 0) {
        validationErrors.push('week_number must be a positive integer.');
      } else {
        updates.week_number = parsedWeek;
      }
    }

    if (deadline !== undefined) {
      if (Number.isNaN(Date.parse(deadline))) {
        validationErrors.push('A valid deadline timestamp is required.');
      } else {
        updates.deadline = new Date(deadline).toISOString();
      }
    }

    if (status !== undefined) {
      if (!VALID_TASK_STATUSES.includes(status)) {
        validationErrors.push(`status must be one of: ${VALID_TASK_STATUSES.join(', ')}.`);
      } else {
        updates.status = status;
      }
    }

    if (submission_schema !== undefined) {
      const schemaValidation = validateSubmissionSchemaDefinition(submission_schema);
      if (!schemaValidation.valid) {
        validationErrors.push(...schemaValidation.errors);
      } else {
        updates.submission_schema = submission_schema;
      }
    }

    if (req.body.allow_late_submissions !== undefined) {
      updates.allow_late_submissions = Boolean(req.body.allow_late_submissions);
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: validationErrors,
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('weekly_tasks')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Update task status (draft/published/archived)
 */
export async function updateTaskStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${VALID_TASK_STATUSES.join(', ')}.`,
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('weekly_tasks')
      .update({ status })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    return res.json({
      success: true,
      message: `Task status updated to '${status}'.`,
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Delete a weekly task
 */
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('weekly_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: 'Weekly task deleted successfully.',
    });
  } catch (err) {
    return next(err);
  }
}
