import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth } from '../src/middleware/authMiddleware.js';
import { requireAdmin } from '../src/middleware/adminMiddleware.js';

describe('Security Middleware: requireAuth', () => {
  it('should return 401 when Authorization header is missing', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = { headers: {} };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };
    const next = () => {
      assert.fail('next() should not be called');
    };

    await requireAuth(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.error.includes('Missing or malformed Bearer authorization token'));
  });

  it('should return 401 when Authorization header is not a Bearer token', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };
    const next = () => {
      assert.fail('next() should not be called');
    };

    await requireAuth(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse.success, false);
  });
});

describe('Security Middleware: requireAdmin', () => {
  it('should return 401 if req.user is missing', async () => {
    let statusCode = null;
    let jsonResponse = null;

    const req = {};
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonResponse = data;
        return this;
      },
    };
    const next = () => {
      assert.fail('next() should not be called');
    };

    await requireAdmin(req, res, next);
    assert.equal(statusCode, 401);
    assert.equal(jsonResponse.success, false);
    assert.ok(jsonResponse.error.includes('User authentication required'));
  });
});
