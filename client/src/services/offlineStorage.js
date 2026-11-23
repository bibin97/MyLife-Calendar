/**
 * offlineStorage.js
 * High-performance, isolated IndexedDB storage for offline activity reading.
 * 
 * Rules:
 * - Scoped strictly by userId to guarantee privacy between different logins.
 * - Stores monthly aggregates and date-specific activity lists.
 * - Clearable on logout.
 */

const DB_NAME = 'MyLifeCalendarOfflineDB';
const DB_VERSION = 1;
const STORE_MONTHS = 'month_marks';
const STORE_ACTIVITIES = 'date_activities';
const STORE_CATEGORIES = 'categories';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_MONTHS)) {
        // Key: `${userId}_${month}` (e.g., "user123_2026-11")
        db.createObjectStore(STORE_MONTHS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        // Key: `${userId}_${date}` (e.g., "user123_2026-11-23")
        db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        // Key: `${userId}`
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  /**
   * Save month activities mark map for a specific user
   */
  async saveMonthMarks(userId, month, marks) {
    if (!userId || !month) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_MONTHS, 'readwrite');
      tx.objectStore(STORE_MONTHS).put({
        id: `${userId}_${month}`,
        userId,
        month,
        marks,
        cachedAt: Date.now()
      });
      return new Promise((res) => { tx.oncomplete = res; });
    } catch (e) {
      console.warn('Offline caching failed for month:', e);
    }
  },

  /**
   * Get cached month activities mark map
   */
  async getMonthMarks(userId, month) {
    if (!userId || !month) return null;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_MONTHS, 'readonly');
      const req = tx.objectStore(STORE_MONTHS).get(`${userId}_${month}`);
      return new Promise((res) => {
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Save date activities list for a specific user
   */
  async saveDateActivities(userId, date, activities) {
    if (!userId || !date) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_ACTIVITIES, 'readwrite');
      tx.objectStore(STORE_ACTIVITIES).put({
        id: `${userId}_${date}`,
        userId,
        date,
        activities,
        cachedAt: Date.now()
      });
      return new Promise((res) => { tx.oncomplete = res; });
    } catch (e) {
      console.warn('Offline caching failed for date activities:', e);
    }
  },

  /**
   * Get cached date activities list
   */
  async getDateActivities(userId, date) {
    if (!userId || !date) return null;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_ACTIVITIES, 'readonly');
      const req = tx.objectStore(STORE_ACTIVITIES).get(`${userId}_${date}`);
      return new Promise((res) => {
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => res(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Save categories list for a specific user
   */
  async saveCategories(userId, categories) {
    if (!userId) return;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
      tx.objectStore(STORE_CATEGORIES).put({
        userId,
        categories,
        cachedAt: Date.now()
      });
      return new Promise((res) => { tx.oncomplete = res; });
    } catch (e) {
      console.warn('Offline caching failed for categories:', e);
    }
  },

  /**
   * Get cached categories
   */
  async getCategories(userId) {
    if (!userId) return null;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_CATEGORIES, 'readonly');
      const req = tx.objectStore(STORE_CATEGORIES).get(userId);
      return new Promise((res) => {
        req.onsuccess = () => res(req.result ? req.result.categories : null);
        req.onerror = () => res(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Purge offline caches for a specific user upon logout
   */
  async clearUserCache(userId) {
    if (!userId) return;
    try {
      const db = await openDB();
      // Clear month entries
      const tx1 = db.transaction(STORE_MONTHS, 'readwrite');
      const store1 = tx1.objectStore(STORE_MONTHS);
      const req1 = store1.openCursor();
      req1.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.userId === userId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      // Clear activity entries
      const tx2 = db.transaction(STORE_ACTIVITIES, 'readwrite');
      const store2 = tx2.objectStore(STORE_ACTIVITIES);
      const req2 = store2.openCursor();
      req2.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (cursor.value.userId === userId) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      // Clear categories
      const tx3 = db.transaction(STORE_CATEGORIES, 'readwrite');
      tx3.objectStore(STORE_CATEGORIES).delete(userId);
    } catch (e) {
      console.warn('Cache clearance error:', e);
    }
  }
};
