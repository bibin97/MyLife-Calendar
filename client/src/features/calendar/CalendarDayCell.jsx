import React from 'react';
import { useTranslation } from 'react-i18next';
import CrossMark from './CrossMark.jsx';

export default function CalendarDayCell({
  day,
  isToday,
  isFuture,
  isSelected,
  markData, // { isMarked: boolean, color: string }
  onSelectDate
}) {
  const { t } = useTranslation();
  const { date, dateKey, dayNumber, isCurrentMonth } = day;

  const handleClick = () => {
    if (isFuture) return;
    onSelectDate(dateKey, isFuture);
  };

  const handleKeyDown = (e) => {
    if (isFuture) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectDate(dateKey, isFuture);
    }
  };

  return (
    <div
      role="button"
      tabIndex={isFuture ? -1 : 0}
      aria-label={`Date ${dateKey}${isFuture ? ' (Future Date - Disabled)' : ''}${markData?.isMarked ? ' (Marked)' : ''}`}
      aria-disabled={isFuture}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative aspect-square sm:aspect-[4/3] md:aspect-[5/4] p-1.5 sm:p-2.5 rounded-xl border transition-all duration-200 select-none flex flex-col justify-between overflow-hidden
        ${isFuture
          ? 'bg-stone-100/70 border-stone-200/60 opacity-40 cursor-not-allowed text-stone-400'
          : 'bg-white border-stone-200/90 hover:border-teal-400 hover:shadow-md cursor-pointer text-stone-800 active:scale-[0.98]'
        }
        ${!isCurrentMonth && !isFuture ? 'opacity-45 bg-stone-50/50' : ''}
        ${isSelected && !isFuture ? 'ring-2 ring-teal-600 border-teal-600 shadow-md bg-teal-50/30' : ''}
      `}
    >
      {/* Top row: Day Number & Today indicator */}
      <div className="flex items-center justify-between w-full z-10">
        <span
          className={`
            text-sm sm:text-base md:text-lg font-bold tracking-tight inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 transition-colors
            ${isToday
              ? 'bg-teal-700 text-white font-extrabold shadow-sm'
              : isFuture
                ? 'text-stone-400'
                : 'text-stone-800'
            }
          `}
        >
          {dayNumber}
        </span>

        {isToday && (
          <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded-full font-malayalam">
            {t('calendar.markedBadge')}
          </span>
        )}
      </div>

      {/* Center: Hand-drawn Single Cross Mark (if marked) */}
      {markData?.isMarked && (
        <CrossMark color={markData.color || '#dc2626'} animated={true} />
      )}

      {/* Bottom status indicator / count dot */}
      <div className="h-2 flex items-center justify-end z-10">
        {markData?.activityCount > 1 && (
          <span className="text-[10px] font-bold text-stone-600 bg-stone-100/90 px-1 rounded-sm border border-stone-200 shadow-2xs">
            {markData.activityCount}
          </span>
        )}
      </div>
    </div>
  );
}
