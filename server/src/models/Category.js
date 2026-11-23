import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    nameEn: {
      type: String,
      required: true,
      trim: true
    },
    nameMl: {
      type: String,
      required: true,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    sessionId: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness for a given user, session or default
categorySchema.index({ key: 1, userId: 1 });
categorySchema.index({ key: 1, sessionId: 1 });

export const Category = mongoose.model('Category', categorySchema);
