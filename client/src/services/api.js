/**
 * SkyNet Frontend API Client
 * Connects to the Express backend API endpoints.
 * Never exposes service-role keys.
 */

const rawBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const API_BASE = rawBase.trim().replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  // Set Content-Type only if not sending FormData (browser sets boundary for FormData)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.details = data.details;
    throw err;
  }

  return data;
}

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

export async function getPublishedTasks(domain) {
  const query = domain && domain !== 'All' ? `?domain=${encodeURIComponent(domain)}` : '';
  return request(`/tasks${query}`);
}

export async function getTaskById(taskId, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/tasks/${taskId}`, { headers });
}

export async function submitTask(taskId, formDataOrObject) {
  let body;
  const headers = {};

  if (formDataOrObject instanceof FormData) {
    body = formDataOrObject;
  } else {
    body = JSON.stringify(formDataOrObject);
    headers['Content-Type'] = 'application/json';
  }

  return request(`/submissions/task/${taskId}`, {
    method: 'POST',
    headers,
    body,
  });
}

export async function getProjects(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/projects${query}`);
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

export async function adminLogin(email, password) {
  return request('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getAuthProfile(token) {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// =============================================================================
// ADMIN PROTECTED ENDPOINTS
// =============================================================================

export async function getAdminTasks(token, filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/tasks/admin/all${params ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminTask(token, taskData) {
  return request('/tasks/admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(taskData),
  });
}

export async function updateAdminTask(token, taskId, taskData) {
  return request(`/tasks/admin/${taskId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(taskData),
  });
}

export async function updateAdminTaskStatus(token, taskId, status) {
  return request(`/tasks/admin/${taskId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminTask(token, taskId) {
  return request(`/tasks/admin/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminSubmissions(token, filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/submissions/admin${params ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminSubmissionById(token, submissionId) {
  return request(`/submissions/admin/${submissionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateAdminSubmissionStatus(token, submissionId, status) {
  return request(`/submissions/admin/${submissionId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export async function deleteAdminSubmission(token, submissionId) {
  return request(`/submissions/admin/${submissionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminProject(token, projectData) {
  return request('/projects/admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(projectData),
  });
}

export async function updateAdminProject(token, projectId, projectData) {
  return request(`/projects/admin/${projectId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(projectData),
  });
}

export async function deleteAdminProject(token, projectId) {
  return request(`/projects/admin/${projectId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function checkBackendHealth() {
  return request('/health');
}
