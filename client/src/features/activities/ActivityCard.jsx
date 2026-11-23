import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Tag, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils.js';

export default function ActivityCard({
  activity,
  language,
  timezone = 'Asia/Kolkata',
  onEdit,
  onDelete,
  index = 0,
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const isML = currentLang === 'ml';

  // Category name in selected language
  const categoryName =
    isML
      ? activity.categoryNameSnapshot?.ml || activity.categoryNameSnapshot?.en || '—'
      : activity.categoryNameSnapshot?.en || '—';

  // Timestamp formatting
  const markedOnDate = formatDisplayDate(activity.selectedDate, currentLang, timezone);
  const savedAtDate = activity.createdAt
    ? formatDisplayDate(activity.createdAt, currentLang, timezone)
    : '—';
  const savedAtTime = activity.createdAt
    ? formatDisplayTime(activity.createdAt, timezone)
    : '—';

  // Readable contrast for noteColor background
  const noteColor = activity.noteColor || '#1c1917';

  // Helper: get luminance-based text colour for the cross colour badge
  const getContrastColor = (hex) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.55 ? '#1c1917' : '#ffffff';
    } catch {
      return '#ffffff';
    }
  };

  const crossColor = activity.crossColor || '#0f766e';
  const crossTextColor = getContrastColor(crossColor);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      className="bg-white/98 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
    >
      {/* Top colour bar matching cross colour */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: crossColor }}
      />

      <div className="p-4 sm:p-5 font-malayalam">
        {/* Header row: category + action buttons */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Tag className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="text-sm font-bold text-teal-800 truncate">
              {categoryName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Edit button */}
            <button
              type="button"
              onClick={() => onEdit(activity)}
              title={t('activity.editTitle')}
              className="p-2 rounded-xl text-stone-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDelete(activity)}
              title={t('activity.deleteTitle')}
              className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes section */}
        {activity.notes ? (
          <div
            className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-100 text-sm leading-relaxed font-malayalam whitespace-pre-wrap break-words"
            style={{ color: noteColor }}
          >
            {activity.notes}
          </div>
        ) : (
          <p className="mb-4 text-sm text-stone-400 italic">
            {t('activity.noNotes')}
          </p>
        )}

        {/* Meta row: dates + colour badges */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Selected calendar date */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="font-semibold text-stone-600">
                {t('activity.markedOn')}
              </span>
              {markedOnDate}
            </span>
          </div>

          {/* Saved at timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="font-semibold text-stone-600">
                {t('activity.savedAt')}
              </span>
              {savedAtDate} {savedAtTime}
            </span>
          </div>

          {/* Colour badges */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Cross colour badge */}
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                style={{ backgroundColor: crossColor, color: crossTextColor }}
                title={t('activity.crossColour')}
              >
                ✕ {t('activity.crossColor_badge')}
              </span>
            </div>
            {/* Note colour badge */}
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0"
              style={{ backgroundColor: noteColor }}
              title={t('activity.noteColour')}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
