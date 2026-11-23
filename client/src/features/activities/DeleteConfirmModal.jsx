import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export default function DeleteConfirmModal({
  isOpen,
  activity,
  language,
  timezone = 'Asia/Kolkata',
  onCancel,
  onConfirmDelete,
  isDeleting = false,
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const isML = currentLang === 'ml';

  if (!isOpen || !activity) return null;

  const categoryName =
    isML
      ? activity.categoryNameSnapshot?.ml || activity.categoryNameSnapshot?.en || '—'
      : activity.categoryNameSnapshot?.en || '—';

  const markedDate = formatDisplayDate(activity.selectedDate, currentLang, timezone);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal panel */}
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 font-malayalam"
            role="dialog"
            aria-modal="true"
            aria-label={t('delete.dialogLabel')}
          >
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-stone-200/80 overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-red-50 to-rose-50 px-6 pt-6 pb-4 border-b border-red-100">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-white/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-2xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-red-800 leading-tight">
                      {t('delete.title')}
                    </h2>
                    <p className="text-xs text-red-600/80 mt-0.5">
                      {t('delete.cannotUndo')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-stone-700 leading-relaxed">
                  {t('delete.areYouSure')}
                </p>

                {/* Activity summary */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-semibold uppercase tracking-wide">
                      {t('delete.categoryLabel')}
                    </span>
                    <span className="text-stone-800 font-bold">{categoryName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-semibold uppercase tracking-wide">
                      {t('delete.dateLabel')}
                    </span>
                    <span className="text-stone-800 font-bold">{markedDate}</span>
                  </div>
                  {/* Cross colour preview */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-semibold uppercase tracking-wide">
                      {t('delete.crossColourLabel')}
                    </span>
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: activity.crossColor || '#0f766e' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-6 pb-6 flex gap-3 font-malayalam">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t('delete.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>{t('delete.deleting')}</span>
                    </>
                  ) : (
                    <span>{t('delete.delete')}</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
