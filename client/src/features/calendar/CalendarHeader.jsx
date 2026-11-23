import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function CalendarHeader({
  currentMonthDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  isCurrentMonthToday,
  language
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';

  const monthIndex = currentMonthDate.getMonth();
  const yearStr = format(currentMonthDate, 'yyyy');

  const monthsMl = [
    'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
    'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
  ];

  const displayTitle = currentLang === 'ml'
    ? `${yearStr} ${monthsMl[monthIndex]}`
    : format(currentMonthDate, 'MMMM yyyy');

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
      {/* Wall Calendar Hanger / Title Accent */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 border border-teal-500/30 flex items-center justify-center text-white shadow-lg shadow-teal-900/15 ring-4 ring-teal-50">
          <CalendarIcon className="w-6 h-6 drop-shadow-xs" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2 font-malayalam">
            {displayTitle}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs text-stone-500 font-semibold font-malayalam tracking-wide">
              {t('calendar.title')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
        {/* Today Button */}
        <button
          type="button"
          onClick={onToday}
          className={`
            px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all duration-200 flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer font-malayalam
            ${isCurrentMonthToday
              ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white border-teal-800 shadow-md shadow-teal-900/20 hover:from-teal-800 hover:to-emerald-800'
              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300'
            }
          `}
        >
          <span>{t('calendar.today')}</span>
        </button>

        {/* Prev & Next Month buttons */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-2xl border border-stone-200 shadow-inner">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label={t('calendar.prevMonth')}
            title={t('calendar.prevMonth')}
            className="p-2 sm:p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white transition-all active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            aria-label={t('calendar.nextMonth')}
            title={t('calendar.nextMonth')}
            className="p-2 sm:p-2.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-white transition-all active:scale-95 shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
