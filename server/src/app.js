import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { env } from './config/env.js';
import { csrfOriginGuard } from './middleware/csrfOriginGuard.js';
import { getAllowedBrowserOrigins } from './utils/originAllowlist.js';
import { containsSensitiveConfig, redactSecrets } from './utils/logRedact.js';

export const createApp = (overrides = {}) => {
  const config = {
    NODE_ENV: overrides.NODE_ENV ?? env.NODE_ENV,
    CLIENT_ORIGIN: overrides.CLIENT_ORIGIN ?? env.CLIENT_ORIGIN,
    FRONTEND_ORIGINS: overrides.FRONTEND_ORIGINS ?? env.FRONTEND_ORIGINS
  };

  const app = express();
  const allowedOrigins = getAllowedBrowserOrigins(config);

  app.use(helmet({
    contentSecurityPolicy: false
  }));

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(csrfOriginGuard(config));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api', apiLimiter);

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/activities', activityRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'MyLife Calendar API',
      timestamp: new Date().toISOString(),
    });
  });

  app.use((err, req, res, next) => {
    console.error('API Error:', redactSecrets(err.message || err));
    const isDev = env.NODE_ENV === 'development';
    const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
    const unsafeMessage = containsSensitiveConfig(err.message);
    const expose = isDev || (statusCode < 500 && !unsafeMessage);
    res.status(statusCode).json({
      error: expose && err.message ? redactSecrets(err.message) : 'Internal Server Error',
      ...(isDev && err.stack ? { stack: redactSecrets(err.stack) } : {})
    });
  });

  return app;
};
