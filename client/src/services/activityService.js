import { api } from './api.js';

export const activityService = {
  /**
   * Fetch aggregate calendar marks for a given month (YYYY-MM)
   */
  async getMonthActivities(monthStr) {
    const res = await api.get(`/activities?month=${monthStr}`);
    return res.data;
  },

  /**
   * Fetch all activities for a specific date (YYYY-MM-DD)
   * Returns { date, activities: [...] }
   */
  async getDateActivities(dateStr) {
    const res = await api.get(`/activities?date=${dateStr}`);
    return res.data;  // { date, activities: [...] }
  },

  /**
   * Record a new activity
   */
  async createActivity(data) {
    const res = await api.post('/activities', data);
    return res.data;
  },

  /**
   * Update an existing activity
   */
  async updateActivity(id, data) {
    const res = await api.patch(`/activities/${id}`, data);
    return res.data;
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id) {
    const res = await api.delete(`/activities/${id}`);
    return res.data;
  }
};
