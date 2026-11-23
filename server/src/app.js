import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import { env } from './config/env.js';

export const createApp = () => {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: false
  }));

  // 2. CORS with cookie support
  app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  }));

  // 3. Body parsers & Cookies
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // 4. Rate Limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api', apiLimiter);

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/activities', activityRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'MyLife Calendar API',
      database: 'mongodb://127.0.0.1:27017/MyLifeCalendar',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    });
  });

  // Centralized Error Handling Middleware
  app.use((err, req, res, next) => {
    console.error('API Error:', err.message || err);
    const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
  });

  return app;
};
