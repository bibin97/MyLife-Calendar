import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { isLocalhostOrigin } from '../utils/originAllowlist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'mylife_calendar_super_secret_jwt_key_2026_dev_mode';

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  FRONTEND_ORIGINS: process.env.FRONTEND_ORIGINS || '',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/MyLifeCalendar',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30d',
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  MAX_OTP_ATTEMPTS: parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10),
  DEV_MODE_OTP: process.env.DEV_MODE_OTP || '123456',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mock',
  COOKIE_SAMESITE: process.env.COOKIE_SAMESITE || 'lax'
};

export const assertProductionEnv = (config = env) => {
  if (config.NODE_ENV !== 'production') return;

  const errors = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be a unique value of at least 32 characters');
  }

  if (
    !process.env.CLIENT_ORIGIN ||
    !/^https:\/\//i.test(config.CLIENT_ORIGIN) ||
    isLocalhostOrigin(config.CLIENT_ORIGIN)
  ) {
    errors.push('CLIENT_ORIGIN must be the exact production HTTPS frontend origin');
  }

  if (!process.env.MONGODB_URI) {
    errors.push('MONGODB_URI must be set');
  }

  if (config.USE_IN_MEMORY_DB) {
    errors.push('USE_IN_MEMORY_DB must not be enabled in production');
  }

  if (errors.length > 0) {
    const err = new Error(`Invalid production configuration: ${errors.join('; ')}`);
    throw err;
  }
};
