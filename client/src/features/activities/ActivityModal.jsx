import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar as CalendarIcon, ArrowRight, Eye } from 'lucide-react';
import CategorySelect from '../categories/CategorySelect.jsx';
import ColorPicker from '../../components/common/ColorPicker.jsx';
import CrossMark from '../calendar/CrossMark.jsx';
import { formatDisplayDate } from '../../utils/dateUtils.js';

export default function ActivityModal({
  isOpen,
  onClose,
  onSubmitForConfirmation,
  selectedDate,
  categories = [],
  language,
  timezone = 'Asia/Kolkata',
  initialValues = null
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';

  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [crossColor, setCrossColor] = useState('#dc2626');
  const [noteColor, setNoteColor] = useState('#1e3a8a');
  const [error, setError] = useState('');

  // Hydrate with initial values (when editing or re-opening from Confirmation Modal)
  useEffect(() => {
    if (initialValues) {
      setCategoryId(initialValues.categoryId || '');
      setNotes(initialValues.notes || '');
      setCrossColor(initialValues.crossColor || '#dc2626');
      setNoteColor(initialValues.noteColor || '#1e3a8a');
    } else {
      setCategoryId('');
      setNotes('');
      setCrossColor('#dc2626');
      setNoteColor('#1e3a8a');
    }
    setError('');
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const displayDateStr = formatDisplayDate(selectedDate, currentLang, timezone);
  const selectedCatObj = categories.find((c) => c._id === categoryId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!categoryId) {
      setError(t('activity.pleaseSelectCategory'));
      return;
    }

    // Step 1 Complete: Pass data to Confirmation Window (DO NOT SAVE YET!)
    onSubmitForConfirmation({
      selectedDate,
      categoryId,
      categoryNameEn: selectedCatObj?.nameEn || '',
      categoryNameMl: selectedCatObj?.nameMl || '',
      notes,
      crossColor,
      noteColor
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200/90 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-stone-50/90 border-b border-stone-200/80 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100/70 border border-teal-200 text-teal-800 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900 font-malayalam">
                {t('activity.recordTitle')}
              </h3>
              <p className="text-xs font-semibold text-teal-800 font-malayalam">
                {displayDateStr}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Category Dropdown (Clean text only) */}
          <CategorySelect
            categories={categories}
            selectedCategoryId={categoryId}
            onSelectCategory={(id) => {
              setCategoryId(id);
              if (error) setError('');
            }}
            language={currentLang}
            error={error}
          />

          {/* Multiline Notes (Unicode-safe for Malayalam and English) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-malayalam">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                {t('activity.notesLabel')}
              </label>
              <span className="text-[11px] text-stone-400 font-medium">
                {t('activity.notesHint')}
              </span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('activity.notesPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 bg-white text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all resize-y font-sans font-malayalam"
            />
          </div>

          {/* Two Independent Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-malayalam">
            {/* Cross Color */}
            <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/70">
              <ColorPicker
                label={t('activity.crossColor')}
                value={crossColor}
                onChange={setCrossColor}
                language={currentLang}
              />
            </div>

            {/* Note Text Color */}
            <div className="p-3 bg-stone-50/70 rounded-2xl border border-stone-200/70">
              <ColorPicker
                label={t('activity.noteColor')}
                value={noteColor}
                onChange={setNoteColor}
                language={currentLang}
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-[#fdfbf7] border border-stone-200 shadow-2xs font-malayalam">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              <Eye className="w-3.5 h-3.5" />
              <span>{t('activity.livePreview')}</span>
            </div>
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-stone-200">
              {/* Calendar cell cross preview */}
              <div className="relative w-12 h-12 rounded-lg border border-stone-200 bg-white flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-stone-400 absolute top-0.5 left-1">
                  {selectedDate.split('-')[2]}
                </span>
                <CrossMark color={crossColor} animated={false} />
              </div>
              {/* Note text preview with selected note color */}
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-stone-800">
                  {selectedCatObj ? (currentLang === 'ml' ? selectedCatObj.nameMl : selectedCatObj.nameEn) : t('activity.categoryPreview')}
                </div>
                <div
                  style={{ color: noteColor }}
                  className="text-xs sm:text-sm font-semibold truncate mt-0.5 font-malayalam"
                >
                  {notes || t('activity.notePreview')}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 font-malayalam">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {t('activity.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>{t('activity.continue')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
