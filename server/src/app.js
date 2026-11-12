import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import tasksRouter from './routes/tasks.js';
import submissionsRouter from './routes/submissions.js';
import projectsRouter from './routes/projects.js';
import authRouter from './routes/auth.js';

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const configuredOrigins = (config.clientOrigin || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const allowed = [
        ...configuredOrigins,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ];

      if (allowed.includes(origin) || !config.isProduction) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' not allowed.`));
    },
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (!config.isTest) {
  app.use(morgan('dev'));
}

// URL Normalization (defensively handle any malformed URL whitespace from client env vars)
app.use((req, res, next) => {
  if (req.url) {
    req.url = req.url.replace(/\/api\/v1(?:\s|%20)+\//g, '/api/v1/');
  }
  next();
});

// System Health Check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'skynet-backend-api',
  });
});

// Mount Feature Routers
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/auth', authRouter);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
