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
        relative aspect-square sm:aspect-[4/3] md:aspect-[5/4] p-1.5 sm:p-2.5 rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between overflow-hidden
        ${isFuture
          ? 'bg-stone-100/50 border-stone-200/50 opacity-40 cursor-not-allowed text-stone-400'
          : 'bg-white/95 border-stone-200/90 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-900/5 hover:-translate-y-0.5 cursor-pointer text-stone-800 active:scale-[0.97]'
        }
        ${!isCurrentMonth && !isFuture ? 'opacity-40 bg-stone-50/40' : ''}
        ${isSelected && !isFuture ? 'ring-3 ring-teal-600/30 border-teal-600 shadow-lg bg-teal-50/40' : ''}
      `}
    >
      {/* Top row: Day Number & Today indicator */}
      <div className="flex items-center justify-between w-full z-10">
        <span
          className={`
            text-sm sm:text-base md:text-lg font-extrabold tracking-tight inline-flex items-center justify-center rounded-xl px-1.5 py-0.5 transition-all
            ${isToday
              ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white font-black shadow-md ring-2 ring-teal-200'
              : isFuture
                ? 'text-stone-400'
                : 'text-stone-800'
            }
          `}
        >
          {dayNumber}
        </span>

        {isToday && (
          <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/90 border border-teal-200/80 px-2 py-0.5 rounded-full font-malayalam shadow-2xs">
            {t('calendar.markedBadge')}
          </span>
        )}
      </div>

      {/* Center: Hand-drawn Single Cross Mark (if marked) */}
      {markData?.isMarked && (
        <CrossMark color={markData.color || '#dc2626'} animated={true} />
      )}

      {/* Bottom status indicator / count dot */}
      <div className="h-3 flex items-center justify-end z-10">
        {markData?.activityCount > 1 && (
          <span className="text-[10px] font-extrabold text-teal-900 bg-teal-100/90 px-1.5 py-0.2 rounded-md border border-teal-200 shadow-2xs">
            +{markData.activityCount - 1}
          </span>
        )}
      </div>
    </div>
  );
}
