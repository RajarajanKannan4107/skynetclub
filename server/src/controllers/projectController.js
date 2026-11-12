import { supabaseAdmin } from '../config/supabase.js';

const VALID_PROJECT_STATUSES = ['coming_soon', 'in_progress', 'completed', 'archived'];

/**
 * Public: Get all projects
 */
export async function getProjects(req, res, next) {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && VALID_PROJECT_STATUSES.includes(status)) {
      query = query.eq('status', status);
    } else {
      // Exclude archived from public view
      query = query.neq('status', 'archived');
    }

    const { data: projects, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Public: Get a single project by ID
 */
export async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Create a new project
 */
export async function createProject(req, res, next) {
  try {
    const {
      title,
      description,
      technologies = [],
      github_url = null,
      demo_url = null,
      thumbnail_url = null,
      status = 'coming_soon',
    } = req.body;

    const validationErrors = [];

    if (!title || typeof title !== 'string' || !title.trim()) {
      validationErrors.push('Project title is required.');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      validationErrors.push('Project description is required.');
    }
    if (status && !VALID_PROJECT_STATUSES.includes(status)) {
      validationErrors.push(`status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}.`);
    }

    const techArray = Array.isArray(technologies)
      ? technologies.map((t) => String(t).trim()).filter(Boolean)
      : [];

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: validationErrors,
      });
    }

    const newProject = {
      title: title.trim(),
      description: description.trim(),
      technologies: techArray,
      github_url: github_url ? String(github_url).trim() : null,
      demo_url: demo_url ? String(demo_url).trim() : null,
      thumbnail_url: thumbnail_url ? String(thumbnail_url).trim() : null,
      status,
    };

    const { data: created, error } = await supabaseAdmin
      .from('projects')
      .insert(newProject)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: created,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Update an existing project
 */
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      technologies,
      github_url,
      demo_url,
      thumbnail_url,
      status,
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

    if (technologies !== undefined) {
      if (!Array.isArray(technologies)) {
        validationErrors.push('technologies must be an array of strings.');
      } else {
        updates.technologies = technologies.map((t) => String(t).trim()).filter(Boolean);
      }
    }

    if (github_url !== undefined) updates.github_url = github_url ? String(github_url).trim() : null;
    if (demo_url !== undefined) updates.demo_url = demo_url ? String(demo_url).trim() : null;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url ? String(thumbnail_url).trim() : null;

    if (status !== undefined) {
      if (!VALID_PROJECT_STATUSES.includes(status)) {
        validationErrors.push(`status must be one of: ${VALID_PROJECT_STATUSES.join(', ')}.`);
      } else {
        updates.status = status;
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: validationErrors,
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Admin: Delete a project
 */
export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      message: 'Project deleted successfully.',
    });
  } catch (err) {
    return next(err);
  }
}
