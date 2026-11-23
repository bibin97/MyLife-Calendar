import React from 'react';
import { useTranslation } from 'react-i18next';
import CalendarDayCell from './CalendarDayCell.jsx';
import {
  getMonthCalendarGrid,
  isDateInFuture,
  isDateToday
} from '../../utils/dateUtils.js';

export default function CalendarGrid({
  currentMonthDate,
  selectedDateKey,
  onSelectDate,
  activityMarks = {}, // map of { 'YYYY-MM-DD': { isMarked: boolean, color: string, activityCount: number } }
  timezone = 'Asia/Kolkata',
  language
}) {
  const { t, i18n } = useTranslation();
  const currentLang = language || i18n.language || 'en';
  const days = getMonthCalendarGrid(currentMonthDate);

  const weekdays = currentLang === 'ml'
    ? ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-panel rounded-3xl p-3.5 sm:p-7 shadow-xl border border-white/90 relative overflow-hidden">
      {/* Wall calendar top decorative binding clips */}
      <div className="absolute top-0 inset-x-0 h-3.5 bg-gradient-to-b from-stone-200 to-stone-100 border-b border-stone-300 flex justify-around items-center px-10 sm:px-20 pointer-events-none">
        <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
        <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
        <div className="w-8 sm:w-10 h-2 rounded-full calendar-hangers"></div>
      </div>

      <div className="pt-3">
        {/* 7 Weekday Columns Header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mb-2.5 sm:mb-4">
          {weekdays.map((dayName, idx) => (
            <div
              key={idx}
              className={`
                text-center py-2 sm:py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl select-none font-malayalam transition-colors
                ${idx === 0
                  ? 'text-rose-600 bg-rose-50/80 border border-rose-100/70'
                  : idx === 6
                    ? 'text-teal-700 bg-teal-50/80 border border-teal-100/70'
                    : 'text-stone-600 bg-stone-100/70 border border-stone-200/60'
                }
              `}
            >
              <span className="block sm:hidden">{dayName.slice(0, 3)}</span>
              <span className="hidden sm:block">{dayName}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days 7-Column Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {days.map((day) => {
            const isToday = isDateToday(day.dateKey, timezone);
            const isFuture = isDateInFuture(day.dateKey, timezone);
            const isSelected = selectedDateKey === day.dateKey;
            const markData = activityMarks[day.dateKey];

            return (
              <CalendarDayCell
                key={day.dateKey}
                day={day}
                isToday={isToday}
                isFuture={isFuture}
                isSelected={isSelected}
                markData={markData}
                onSelectDate={onSelectDate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
