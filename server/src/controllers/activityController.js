import { Activity } from '../models/Activity.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activityValidator.js';
import { isDateAllowed } from '../utils/dateValidator.js';
import { documentOwnedByRequester, findUsableCategory, getOwnerFilter, isDeviceAuth } from '../utils/ownerScope.js';

export const activityController = {
  getOwnerFilter,

  /**
   * GET /api/activities?month=YYYY-MM OR ?date=YYYY-MM-DD
   */
  async getActivities(req, res, next) {
    try {
      const { month, date } = req.query;
      const ownerFilter = activityController.getOwnerFilter(req);

      // 1. Month Aggregate Query for Calendar Grid (One Cross Rule)
      if (month) {
        if (!/^\d{4}-\d{2}$/.test(month)) {
          return res.status(400).json({ error: 'Month must be in YYYY-MM format' });
        }

        const activities = await Activity.find({
          ...ownerFilter,
          selectedDate: { $regex: `^${month}` }
        }).sort({ createdAt: -1 });

        // Aggregate by date: latest activity determines the visible cross color
        const marks = {};
        for (const act of activities) {
          if (!marks[act.selectedDate]) {
            marks[act.selectedDate] = {
              isMarked: true,
              color: act.crossColor,
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
          ...ownerFilter,
          selectedDate: date
        }).sort({ createdAt: -1 });

        return res.status(200).json({ date, activities });
      }

      // If no parameter passed, return recent activities
      const recent = await Activity.find(ownerFilter)
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

      const category = await findUsableCategory(categoryId, req);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const isDevice = isDeviceAuth(req);

      // Build authoritative activity document
      const activityData = {
        selectedDate,
        categoryId: category._id,
        categoryNameSnapshot: {
          en: category.nameEn,
          ml: category.nameMl
        },
        notes: notes || '',
        crossColor: crossColor || '#dc2626',
        noteColor: noteColor || '#1e3a8a'
      };

      if (isDevice) {
        activityData.sessionId = req.user.sessionId || req.deviceSession.sessionId;
      } else {
        activityData.userId = req.user._id;
      }

      const activity = await Activity.create(activityData);

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

      const ownerFilter = getOwnerFilter(req);
      const activity = await Activity.findOne({ _id: id, ...ownerFilter });
      if (!activity) {
        const exists = await Activity.findById(id);
        if (!exists) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        return res.status(403).json({ error: 'You do not have permission to edit this activity.' });
      }

      if (!documentOwnedByRequester(activity, req)) {
        return res.status(403).json({ error: 'You do not have permission to edit this activity.' });
      }

      // If category updated, refresh snapshot
      if (parsed.data.categoryId && parsed.data.categoryId !== activity.categoryId.toString()) {
        const category = await findUsableCategory(parsed.data.categoryId, req);
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
   */
  async deleteActivity(req, res, next) {
    try {
      const { id } = req.params;
      const ownerFilter = getOwnerFilter(req);
      const activity = await Activity.findOne({ _id: id, ...ownerFilter });

      if (!activity) {
        const exists = await Activity.findById(id);
        if (!exists) {
          return res.status(404).json({ error: 'Activity not found' });
        }
        return res.status(403).json({ error: 'You do not have permission to delete this activity.' });
      }

      const selectedDate = activity.selectedDate;

      const deleted = await Activity.deleteOne({ _id: activity._id, ...ownerFilter });
      if (deleted.deletedCount !== 1) {
        return res.status(403).json({ error: 'You do not have permission to delete this activity.' });
      }

      // Check remaining activities on that date to update or remove cross mark
      const remaining = await Activity.find({ ...ownerFilter, selectedDate }).sort({ createdAt: -1 });

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
