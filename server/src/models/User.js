import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      default: 'Calendar User',
      trim: true
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'ml'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', userSchema);
