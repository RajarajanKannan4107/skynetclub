import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { dispatchRequest } from './testHelper.js';

describe('SkyNet Backend API Endpoints (In-Memory Sandbox Safe)', () => {
  it('GET /api/v1/health should return healthy status', async () => {
    const res = await dispatchRequest(app, { method: 'GET', url: '/api/v1/health' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.service, 'skynet-backend-api');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/v1/unknown-route should return structured 404', async () => {
    const res = await dispatchRequest(app, { method: 'GET', url: '/api/v1/non-existent-endpoint' });
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error.includes('Route not found'));
  });

  describe('Security & Authorization Boundary Enforcement', () => {
    it('POST /api/v1/tasks/admin should reject unauthenticated requests with 401', async () => {
      const res = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/v1/tasks/admin',
        body: { title: 'Unauthorized Task' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Unauthorized'));
    });

    it('GET /api/v1/submissions/admin should reject unauthenticated requests with 401', async () => {
      const res = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/v1/submissions/admin',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('POST /api/v1/projects/admin should reject unauthenticated requests with 401', async () => {
      const res = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/v1/projects/admin',
        body: { title: 'Secret Project' },
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('GET /api/v1/auth/me should reject unauthenticated requests with 401', async () => {
      const res = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/v1/auth/me',
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });
  });

  describe('Public Endpoints & Input Validation', () => {
    it('POST /api/v1/auth/admin-login should require email and password', async () => {
      const res = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/v1/auth/admin-login',
        body: {},
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.ok(res.body.error.includes('Email and password are required'));
    });

    it('POST /api/v1/submissions/task/:taskId should reject invalid format when task does not exist', async () => {
      const res = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/v1/submissions/task/00000000-0000-0000-0000-000000000000',
        body: {},
      });
      assert.ok([400, 404, 500].includes(res.status));
      assert.equal(res.body.success, false);
    });
  });
});
