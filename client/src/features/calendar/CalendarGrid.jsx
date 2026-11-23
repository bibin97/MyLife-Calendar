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
    <div className="bg-white rounded-3xl p-3 sm:p-6 shadow-md border border-stone-200/90 relative overflow-hidden">
      {/* Wall calendar top decorative binding clips */}
      <div className="absolute top-0 inset-x-0 h-3 bg-stone-100/90 border-b border-stone-200 flex justify-around items-center px-8 sm:px-16 pointer-events-none">
        <div className="w-6 sm:w-8 h-2 rounded-full bg-stone-300 shadow-inner"></div>
        <div className="w-6 sm:w-8 h-2 rounded-full bg-stone-300 shadow-inner"></div>
        <div className="w-6 sm:w-8 h-2 rounded-full bg-stone-300 shadow-inner"></div>
      </div>

      <div className="pt-2">
        {/* 7 Weekday Columns Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
          {weekdays.map((dayName, idx) => (
            <div
              key={idx}
              className={`
                text-center py-2 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg select-none font-malayalam
                ${idx === 0
                  ? 'text-red-600 bg-red-50/50'
                  : idx === 6
                    ? 'text-teal-700 bg-teal-50/40'
                    : 'text-stone-600 bg-stone-50/70'
                }
              `}
            >
              <span className="block sm:hidden">{dayName.slice(0, 3)}</span>
              <span className="hidden sm:block">{dayName}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days 7-Column Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
