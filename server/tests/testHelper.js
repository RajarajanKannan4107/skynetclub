import { EventEmitter } from 'events';

/**
 * Dispatches a simulated HTTP request directly to the Express app in-memory,
 * bypassing network sockets (works 100% inside sandboxed environments).
 */
export function dispatchRequest(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = url;
    req.originalUrl = url;
    req.headers = { ...headers };
    req.body = body;
    req.query = {};
    req.socket = { remoteAddress: '127.0.0.1', destroy() {} };
    req.connection = req.socket;

    // Parse query params if present
    if (url.includes('?')) {
      const queryString = url.split('?')[1];
      const params = new URLSearchParams(queryString);
      for (const [key, val] of params.entries()) {
        req.query[key] = val;
      }
    }

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    let responseData = '';

    res.setHeader = (key, val) => {
      res._headers[key.toLowerCase()] = val;
      return res;
    };

    res.getHeader = (key) => res._headers[key.toLowerCase()];

    res.hasHeader = (key) => Boolean(res._headers[key.toLowerCase()]);

    res.removeHeader = (key) => {
      delete res._headers[key.toLowerCase()];
    };

    res.getHeaders = () => ({ ...res._headers });

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.json = (data) => {
      res.setHeader('content-type', 'application/json');
      res.body = data;
      resolve({
        status: res.statusCode,
        statusCode: res.statusCode,
        body: data,
        headers: res._headers,
      });
      return res;
    };

    res.send = (chunk) => {
      responseData += chunk;
      try {
        res.body = JSON.parse(responseData);
      } catch {
        res.body = responseData;
      }
      resolve({
        status: res.statusCode,
        statusCode: res.statusCode,
        body: res.body,
        headers: res._headers,
      });
      return res;
    };

    res.end = (chunk) => {
      if (chunk) responseData += chunk;
      try {
        res.body = JSON.parse(responseData);
      } catch {
        res.body = responseData;
      }
      resolve({
        status: res.statusCode,
        statusCode: res.statusCode,
        body: res.body,
        headers: res._headers,
      });
      return res;
    };

    try {
      app.handle(req, res);
    } catch (err) {
      reject(err);
    }
  });
}
