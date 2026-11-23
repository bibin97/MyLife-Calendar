import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Edit3, X, Loader2, Clock, Calendar, Palette, Tag } from 'lucide-react';
import CrossMark from '../calendar/CrossMark.jsx';
import { formatDisplayDate, formatDisplayTime, getNowInTimezone } from '../../utils/dateUtils.js';

export default function ActivityConfirmModal({
  isOpen,
  activityData,
  onEdit,
  onCancel,
  onConfirmSave,
  isSubmitting = false,
  language,
  timezone = 'Asia/Kolkata',
  isEditMode = false,   // Phase 6: shows "Update" instead of "Confirm & Save"
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const [submissionTimePreview, setSubmissionTimePreview] = useState('');

  // Generate live client preview time with seconds upon opening
  useEffect(() => {
    if (isOpen) {
      const now = getNowInTimezone(timezone);
      setSubmissionTimePreview(formatDisplayTime(now, timezone));
    }
  }, [isOpen, timezone]);

  if (!isOpen || !activityData) return null;

  const {
    selectedDate,
    categoryNameEn,
    categoryNameMl,
    notes,
    crossColor,
    noteColor
  } = activityData;

  const displaySelectedDate = formatDisplayDate(selectedDate, currentLang, timezone);
  const nowInTz = getNowInTimezone(timezone);
  const displayMarkedOnDate = formatDisplayDate(nowInTz, currentLang, timezone);
  const categoryDisplayName = currentLang === 'ml' ? (categoryNameMl || categoryNameEn) : (categoryNameEn || categoryNameMl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200/90 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-teal-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between font-malayalam">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-700/80 border border-teal-600 flex items-center justify-center">
              <Check className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                {isEditMode ? t('confirm.updateTitle') : t('confirm.title')}
              </h3>
              <p className="text-xs text-teal-200">
                {t('confirm.reviewBefore')}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="p-1 rounded-xl text-teal-200 hover:text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Details Card */}
        <div className="p-5 sm:p-6 space-y-4 font-malayalam">
          <div className="bg-[#fdfbf7] rounded-2xl border border-stone-200 p-4 space-y-3.5 text-xs sm:text-sm shadow-2xs">
            {/* Selected Date */}
            <div className="flex items-start justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span>{t('confirm.selectedDate')}</span>
              </div>
              <span className="font-extrabold text-stone-900 text-right">
                {displaySelectedDate}
              </span>
            </div>

            {/* Submission Time Preview with Seconds */}
            <div className="flex items-start justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Clock className="w-4 h-4 text-teal-700" />
                <span>{t('confirm.markedAt')}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-teal-900">
                  {submissionTimePreview}
                </span>
                <span className="block text-[10px] text-stone-400">
                  ({displayMarkedOnDate})
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-start justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Tag className="w-4 h-4 text-teal-700" />
                <span>{t('confirm.category')}</span>
              </div>
              <span className="font-extrabold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                {categoryDisplayName}
              </span>
            </div>

            {/* Cross Color */}
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Palette className="w-4 h-4 text-teal-700" />
                <span>{t('confirm.crossColor')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6 rounded-md border border-stone-300 bg-white flex items-center justify-center">
                  <CrossMark color={crossColor} animated={false} />
                </div>
                <span className="font-mono font-bold text-xs uppercase text-stone-800">
                  {crossColor}
                </span>
              </div>
            </div>

            {/* Note Color */}
            <div className="flex items-center justify-between border-b border-stone-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-stone-500 font-semibold">
                <Palette className="w-4 h-4 text-teal-700" />
                <span>{t('confirm.noteColor')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-md border border-stone-300 shadow-2xs inline-block"
                  style={{ backgroundColor: noteColor }}
                />
                <span className="font-mono font-bold text-xs uppercase text-stone-800">
                  {noteColor}
                </span>
              </div>
            </div>

            {/* Notes content */}
            <div>
              <span className="block text-stone-500 font-semibold mb-1">
                {t('confirm.notes')}
              </span>
              <div
                style={{ color: noteColor }}
                className="p-3 rounded-xl bg-white border border-stone-200 font-medium text-xs sm:text-sm whitespace-pre-wrap font-malayalam break-words"
              >
                {notes || (
                  <span className="text-stone-300 italic">
                    {t('confirm.noNotes')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit, Cancel, Confirm & Save */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 font-malayalam">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onEdit}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-stone-500" />
              <span>{t('activity.edit')}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>{t('activity.cancel')}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirmSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-stone-300 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('confirm.saving')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isEditMode ? t('confirm.updateActivity') : t('confirm.confirmSave')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
