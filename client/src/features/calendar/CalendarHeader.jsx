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
    <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200/80 mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Wall Calendar Hanger / Title Accent */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2 font-malayalam">
            {displayTitle}
          </h2>
          <p className="text-xs text-stone-500 font-medium font-malayalam">
            {t('calendar.title')}
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Today Button */}
        <button
          type="button"
          onClick={onToday}
          className={`
            px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer font-malayalam
            ${isCurrentMonthToday
              ? 'bg-teal-700 text-white border-teal-800 shadow-sm hover:bg-teal-800'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
            }
          `}
        >
          <span>{t('calendar.today')}</span>
        </button>

        {/* Prev & Next Month buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label={t('calendar.prevMonth')}
            title={t('calendar.prevMonth')}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 transition-colors active:scale-95 shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onNextMonth}
            aria-label={t('calendar.nextMonth')}
            title={t('calendar.nextMonth')}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 transition-colors active:scale-95 shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
