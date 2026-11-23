import mongoose from 'mongoose';

const deviceSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      index: true
    },
    displayPhone: {
      type: String,
      required: true,
      trim: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ml'],
      default: 'en'
    }
  },
  {
    timestamps: true
  }
);

export const DeviceSession = mongoose.model('DeviceSession', deviceSessionSchema);
