import { Activity } from '../models/Activity.js';
import { Category } from '../models/Category.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activityValidator.js';
import { isDateAllowed } from '../utils/dateValidator.js';

export const activityController = {
  /**
   * GET /api/activities?month=YYYY-MM OR ?date=YYYY-MM-DD
   */
  async getActivities(req, res, next) {
    try {
      const { month, date } = req.query;
      const userId = req.user._id;

      // 1. Month Aggregate Query for Calendar Grid (One Cross Rule)
      if (month) {
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
        }

        const activities = await Activity.find({
          userId,
          selectedDate: { $regex: `^${month}` }
        }).sort({ createdAt: -1 });

        // Aggregate by date: latest activity determines the visible cross color
        const marks = {};
        for (const act of activities) {
          if (!marks[act.selectedDate]) {
            marks[act.selectedDate] = {
              isMarked: true,
              color: act.crossColor, // Newest activity color (since query is sorted createdAt: -1)
              activityCount: 1,
              latestCreatedAt: act.createdAt
            };
          } else {
            marks[act.selectedDate].activityCount += 1;
          }
        }

        return res.status(200).json({ month, marks });
      }

      // 2. Single Date Query for Activity Cards Below Calendar
      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
        }

        const activities = await Activity.find({
          userId,
          selectedDate: date
        }).sort({ createdAt: -1 }); // Newest first

        return res.status(200).json({ date, activities });
      }

      // If no parameter passed, return recent activities
      const recent = await Activity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      res.status(200).json({ activities: recent });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/activities
   * Create an activity with authoritative server timestamp
   */
  async createActivity(req, res, next) {
    try {
      const parsed = createActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const { selectedDate, categoryId, notes, crossColor, noteColor } = parsed.data;
      const userTimezone = req.user.timezone || 'Asia/Kolkata';

      // Strict Future Date Validation (Backend Guard)
      if (!isDateAllowed(selectedDate, userTimezone)) {
        return res.status(400).json({
          error: 'Future dates are strictly restricted. You cannot record activities for future dates.'
        });
      }

      // Resolve Category and take name snapshot
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Build authoritative activity document
      const activity = await Activity.create({
        userId: req.user._id, // Enforce authenticated user ownership
        selectedDate,
        categoryId: category._id,
        categoryNameSnapshot: {
          en: category.nameEn,
          ml: category.nameMl
        },
        notes: notes || '', // Raw Unicode text preserved unaltered
        crossColor: crossColor || '#dc2626',
        noteColor: noteColor || '#1e3a8a'
      });

      res.status(201).json({
        message: 'Activity recorded successfully',
        activity
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/activities/:id
   * Edit an activity (maintains original createdAt timestamp)
   */
  async updateActivity(req, res, next) {
    try {
      const { id } = req.params;
      const parsed = updateActivitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const activity = await Activity.findById(id);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      // User Ownership Check
      if (activity.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You do not have permission to edit this activity.' });
      }

      // If category updated, refresh snapshot
      if (parsed.data.categoryId && parsed.data.categoryId !== activity.categoryId.toString()) {
        const category = await Category.findById(parsed.data.categoryId);
        if (!category) {
          return res.status(404).json({ error: 'New category not found' });
        }
        activity.categoryId = category._id;
        activity.categoryNameSnapshot = {
          en: category.nameEn,
          ml: category.nameMl
        };
      }

      if (parsed.data.notes !== undefined) activity.notes = parsed.data.notes;
      if (parsed.data.crossColor) activity.crossColor = parsed.data.crossColor;
      if (parsed.data.noteColor) activity.noteColor = parsed.data.noteColor;

      // Note: createdAt remains completely untouched
      await activity.save();

      res.status(200).json({
        message: 'Activity updated successfully',
        activity
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/activities/:id
   * Delete an activity and calculate remaining count for cross mark removal
   */
  async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;
      const activity = await Activity.findById(id);

      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }

      // User Ownership Check
      if (activity.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You do not have permission to delete this activity.' });
      }

      const selectedDate = activity.selectedDate;
      const userId = activity.userId;

      await Activity.deleteOne({ _id: activity._id });

      // Check remaining activities on that date to update or remove cross mark
      const remaining = await Activity.find({ userId, selectedDate }).sort({ createdAt: -1 });

      res.status(200).json({
        message: 'Activity deleted successfully',
        selectedDate,
        remainingCount: remaining.length,
        newLatestCrossColor: remaining.length > 0 ? remaining[0].crossColor : null
      });
    } catch (error) {
      next(error);
    }
  }
};
