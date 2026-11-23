import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import CalendarView from '../features/calendar/CalendarView.jsx';
import ActivityModal from '../features/activities/ActivityModal.jsx';
import ActivityConfirmModal from '../features/activities/ActivityConfirmModal.jsx';
import ActivityList from '../features/activities/ActivityList.jsx';
import DeleteConfirmModal from '../features/activities/DeleteConfirmModal.jsx';
import Toast from '../components/common/Toast.jsx';
import { categoryService } from '../services/categoryService.js';
import { activityService } from '../services/activityService.js';
import { offlineStorage } from '../services/offlineStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import { toDateKey, getNowInTimezone, isDateInFuture } from '../utils/dateUtils.js';

export default function DashboardPage({
  language,
  timezone = 'Asia/Kolkata',
  categories: externalCategories,
  onCategoriesRefresh,
  isOffline = false
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentLang = language || i18n.language || 'en';

  /* ─────────────────────────── Date & month state ─────────────────────── */
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(getNowInTimezone(timezone), timezone)
  );
  const [currentViewingMonth, setCurrentViewingMonth] = useState(() =>
    toDateKey(getNowInTimezone(timezone), timezone).slice(0, 7)
  );

  /* ─────────────────────────── Data state ─────────────────────────────── */
  const [internalCategories, setInternalCategories] = useState([]);
  const categories = externalCategories || internalCategories;
  const [activityMarks, setActivityMarks] = useState({});
  const [isDataCached, setIsDataCached] = useState(false);

  /* ─────────────────────────── List refresh trigger ───────────────────── */
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const refreshList = () => setListRefreshKey((k) => k + 1);

  /* ─────────────────────────── Modal states ───────────────────────────── */
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingActivityData, setPendingActivityData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // For edit: holds the activity being edited (null = create mode)
  const [editingActivity, setEditingActivity] = useState(null);

  // For delete
  const [deletingActivity, setDeletingActivity] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ─────────────────────────── Toast ──────────────────────────────────── */
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  /* ─────────────────────────── Load categories (Online + IndexedDB Fallback) ─ */
  useEffect(() => {
    if (externalCategories) return;
    let isMounted = true;
    categoryService.getCategories()
      .then((cats) => {
        if (isMounted) {
          setInternalCategories(cats);
          if (user?._id) offlineStorage.saveCategories(user._id, cats);
        }
      })
      .catch(async () => {
        if (user?._id) {
          const cached = await offlineStorage.getCategories(user._id);
          if (isMounted && cached) {
            setInternalCategories(cached);
          }
        }
      });
    return () => { isMounted = false; };
  }, [externalCategories, user]);

  /* ─────────────────────────── Load monthly marks (Online + IndexedDB Fallback) ─ */
  const loadMonthMarks = useCallback(async (monthStr) => {
    try {
      const data = await activityService.getMonthActivities(monthStr);
      setActivityMarks(data.marks || {});
      setIsDataCached(false);
      if (user?._id) {
        offlineStorage.saveMonthMarks(user._id, monthStr, data.marks || {});
      }
    } catch (err) {
      // Backend unreachable or offline — read from IndexedDB
      if (user?._id) {
        const cached = await offlineStorage.getMonthMarks(user._id, monthStr);
        if (cached && cached.marks) {
          setActivityMarks(cached.marks);
          setIsDataCached(true);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    loadMonthMarks(currentViewingMonth);
  }, [currentViewingMonth, loadMonthMarks]);

  /* ─────────────────────────── Calendar date click ────────────────────── */
  const handleDateClick = (dateKey, isFuture) => {
    if (isFuture) {
      showToast(t('calendar.futureRestricted'), 'error');
      return;
    }
    setSelectedDateKey(dateKey);
    const markData = activityMarks[dateKey];
    if (!markData?.isMarked) {
      if (isOffline) {
        showToast(t('offline.offlineReadOnly'), 'error');
        return;
      }
      openAddModal(dateKey);
    }
  };

  /* ─────────────────────────── Open Add Modal ─────────────────────────── */
  const openAddModal = (dateKey = selectedDateKey) => {
    if (isOffline) {
      showToast(t('offline.offlineReadOnly'), 'error');
      return;
    }
    if (isDateInFuture(dateKey, timezone)) {
      showToast(t('calendar.futureRestrictedShort'), 'error');
      return;
    }
    setEditingActivity(null);
    setPendingActivityData(null);
    setIsEntryModalOpen(true);
  };

  /* ─────────────────────────── Open Edit Modal ────────────────────────── */
  const handleEditActivity = (activity) => {
    if (isOffline) {
      showToast(t('offline.offlineReadOnly'), 'error');
      return;
    }
    setEditingActivity(activity);
    setPendingActivityData({
      selectedDate: activity.selectedDate,
      categoryId: activity.categoryId,
      notes: activity.notes || '',
      crossColor: activity.crossColor || '#0f766e',
      noteColor: activity.noteColor || '#1c1917',
    });
    setIsEntryModalOpen(true);
  };

  /* ─────────────────────────── Step 1 -> Step 2 Confirmation ─────────── */
  const handleSubmitForConfirmation = (data) => {
    setPendingActivityData(data);
    setIsEntryModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleEditConfirmation = () => {
    setIsConfirmModalOpen(false);
    setIsEntryModalOpen(true);
  };

  const handleCancelConfirmation = () => {
    setIsConfirmModalOpen(false);
    setPendingActivityData(null);
    setEditingActivity(null);
  };

  const handleConfirmAndSave = async () => {
    if (isSaving || !pendingActivityData) return;
    setIsSaving(true);

    try {
      if (editingActivity) {
        await activityService.updateActivity(editingActivity._id, {
          categoryId: pendingActivityData.categoryId,
          notes: pendingActivityData.notes,
          crossColor: pendingActivityData.crossColor,
          noteColor: pendingActivityData.noteColor,
        });
        showToast(t('toast.activityUpdated') || 'Activity updated successfully', 'success');
      } else {
        await activityService.createActivity({
          selectedDate: pendingActivityData.selectedDate,
          categoryId: pendingActivityData.categoryId,
          notes: pendingActivityData.notes,
          crossColor: pendingActivityData.crossColor,
          noteColor: pendingActivityData.noteColor,
          timezone,
        });
        showToast(t('toast.activityCreated') || 'Activity saved successfully', 'success');
      }

      const monthKey = pendingActivityData.selectedDate.slice(0, 7);
      await loadMonthMarks(monthKey);
      refreshList();

      setIsConfirmModalOpen(false);
      setPendingActivityData(null);
      setEditingActivity(null);
    } catch (err) {
      showToast(err.message || 'Failed to save activity', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /* ─────────────────────────── Delete flow ────────────────────────────── */
  const handleDeleteActivity = (activity) => {
    if (isOffline) {
      showToast(t('offline.offlineReadOnly'), 'error');
      return;
    }
    setDeletingActivity(activity);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingActivity(null);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !deletingActivity) return;
    setIsDeleting(true);

    try {
      await activityService.deleteActivity(deletingActivity._id);
      const dateKey = deletingActivity.selectedDate;
      const monthKey = dateKey.slice(0, 7);

      await loadMonthMarks(monthKey);
      refreshList();

      setIsDeleteModalOpen(false);
      setDeletingActivity(null);

      showToast(t('toast.activityDeleted'), 'success');
    } catch (err) {
      showToast(err.message || t('toast.failedDelete'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto flex flex-col items-center font-sans">
      {/* ── Wall Calendar ─────────────────────────────────────────────── */}
      <CalendarView
        timezone={timezone}
        language={currentLang}
        activityMarks={activityMarks}
        selectedDateKey={selectedDateKey}
        onDateClick={handleDateClick}
        onMonthChange={(newMonth) => setCurrentViewingMonth(newMonth)}
      />

      {/* ── Activity List BELOW calendar ──────────────────────────────── */}
      <ActivityList
        key={selectedDateKey}
        selectedDateKey={selectedDateKey}
        language={currentLang}
        timezone={timezone}
        onAddActivity={() => openAddModal(selectedDateKey)}
        onEditActivity={handleEditActivity}
        onDeleteActivity={handleDeleteActivity}
        refreshTrigger={listRefreshKey}
        isOffline={isOffline}
      />

      {/* ── Step 1: Activity Entry Modal ──────────────────────────────── */}
      <ActivityModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setPendingActivityData(null);
          setEditingActivity(null);
        }}
        onSubmitForConfirmation={handleSubmitForConfirmation}
        selectedDate={selectedDateKey}
        categories={categories}
        language={currentLang}
        timezone={timezone}
        initialValues={pendingActivityData}
        isEditMode={!!editingActivity}
      />

      {/* ── Step 2: Confirmation Modal ────────────────────────────────── */}
      <ActivityConfirmModal
        isOpen={isConfirmModalOpen}
        activityData={pendingActivityData}
        onEdit={handleEditConfirmation}
        onCancel={handleCancelConfirmation}
        onConfirmSave={handleConfirmAndSave}
        isSubmitting={isSaving}
        language={currentLang}
        timezone={timezone}
        isEditMode={!!editingActivity}
      />

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        activity={deletingActivity}
        language={currentLang}
        timezone={timezone}
        onCancel={handleCancelDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
