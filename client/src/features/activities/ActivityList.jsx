import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, RefreshCw, ListX } from 'lucide-react';
import ActivityCard from './ActivityCard.jsx';
import { activityService } from '../../services/activityService.js';
import { offlineStorage } from '../../services/offlineStorage.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { isDateInFuture } from '../../utils/dateUtils.js';

export default function ActivityList({
  selectedDateKey,
  language,
  timezone = 'Asia/Kolkata',
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  refreshTrigger = 0,
  isOffline = false
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = language || i18n.language || 'en';
  const isML = currentLang === 'ml';

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState('');

  const isFuture = selectedDateKey ? isDateInFuture(selectedDateKey, timezone) : false;

  const loadActivities = useCallback(async () => {
    if (!selectedDateKey) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await activityService.getDateActivities(selectedDateKey);
      const list = Array.isArray(result) ? result : (result.activities || []);
      setActivities(list);
      setIsCached(false);
      // Persist to user's isolated IndexedDB store
      if (user?._id) {
        offlineStorage.saveDateActivities(user._id, selectedDateKey, list);
      }
    } catch (err) {
      // Offline fallback
      if (user?._id) {
        const cached = await offlineStorage.getDateActivities(user._id, selectedDateKey);
        if (cached && Array.isArray(cached.activities)) {
          setActivities(cached.activities);
          setIsCached(true);
          return;
        }
      }
      setError(err.message || t('toast.failedLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateKey, t, user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshTrigger]);

  if (!selectedDateKey) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mt-4 font-malayalam"
      aria-label={t('activity.sectionTitle')}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-base font-bold text-teal-900 tracking-tight flex items-center gap-2">
          <span>{t('activity.sectionTitle')}</span>
          {activities.length > 0 && (
            <span className="text-xs font-semibold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
              {activities.length}
            </span>
          )}
          {isCached && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
              {t('offline.cachedBadge')}
            </span>
          )}
        </h2>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={loadActivities}
            disabled={isLoading || isOffline}
            title={t('activity.refresh')}
            className="p-2 rounded-xl text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Activity button */}
          {!isFuture && (
            <button
              type="button"
              onClick={onAddActivity}
              disabled={isOffline}
              title={isOffline ? t('offline.offlineReadOnly') : t('activity.addActivity')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('activity.addActivity')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 bg-stone-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400 bg-white/80 rounded-2xl border border-stone-100"
        >
          <ListX className="w-10 h-10 opacity-30" />
          <p className="text-sm text-center px-6">
            {isFuture
              ? t('activity.futureNoActivities')
              : t('activity.noActivities')}
          </p>
          {!isFuture && (
            <button
              type="button"
              onClick={onAddActivity}
              className="mt-1 px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all cursor-pointer font-malayalam"
            >
              {t('activity.addFirst')}
            </button>
          )}
        </motion.div>
      )}

      {/* Activity cards — newest first */}
      {!isLoading && !error && activities.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <ActivityCard
                key={activity._id}
                activity={activity}
                language={currentLang}
                timezone={timezone}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                index={idx}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.section>
  );
}
