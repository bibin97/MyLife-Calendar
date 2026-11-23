import mongoose from 'mongoose';

const otpSessionSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '5m' }
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const OtpSession = mongoose.model('OtpSession', otpSessionSchema);
