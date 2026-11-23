import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for device-bound sessions
      default: null,
      index: true
    },
    sessionId: {
      type: String,
      required: false, // Set when activity belongs to a device session
      default: null,
      index: true
    },
    selectedDate: {
      type: String, // Stored in YYYY-MM-DD format
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    categoryNameSnapshot: {
      en: { type: String, required: true },
      ml: { type: String, required: true }
    },
    notes: {
      type: String,
      default: '',
      trim: false // Preserve user spaces and newlines intact
    },
    crossColor: {
      type: String,
      default: '#dc2626',
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    noteColor: {
      type: String,
      default: '#1e3a8a',
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    }
  },
  {
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

// High-performance compound indexes for calendar queries
activitySchema.index({ userId: 1, selectedDate: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ sessionId: 1, selectedDate: 1, createdAt: -1 });
activitySchema.index({ sessionId: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
