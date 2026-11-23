import React, { useState } from 'react';
import { addMonths, subMonths, isSameMonth } from 'date-fns';
import CalendarHeader from './CalendarHeader.jsx';
import CalendarGrid from './CalendarGrid.jsx';
import { toDateKey, getNowInTimezone } from '../../utils/dateUtils.js';

export default function CalendarView({
  timezone = 'Asia/Kolkata',
  language = 'en',
  activityMarks = {},
  selectedDateKey,
  onDateClick,
  onMonthChange,   // Phase 6: notify parent when month changes
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => getNowInTimezone(timezone));

  const nowInTz = getNowInTimezone(timezone);
  const isCurrentMonthToday = isSameMonth(currentMonthDate, nowInTz);

  const changeMonth = (newDate) => {
    setCurrentMonthDate(newDate);
    const monthStr = toDateKey(newDate, timezone).slice(0, 7);
    onMonthChange?.(monthStr);
  };

  const handlePrevMonth = () => {
    changeMonth(subMonths(currentMonthDate, 1));
  };

  const handleNextMonth = () => {
    changeMonth(addMonths(currentMonthDate, 1));
  };

  const handleToday = () => {
    const today = getNowInTimezone(timezone);
    changeMonth(today);
    const todayKey = toDateKey(today, timezone);
    onDateClick?.(todayKey, false);
  };

  const handleSelectDate = (dateKey, isFuture) => {
    if (isFuture) return;
    onDateClick?.(dateKey, isFuture);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <CalendarHeader
        currentMonthDate={currentMonthDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        isCurrentMonthToday={isCurrentMonthToday}
        language={language}
      />
      <CalendarGrid
        currentMonthDate={currentMonthDate}
        selectedDateKey={selectedDateKey}
        onSelectDate={handleSelectDate}
        activityMarks={activityMarks}
        timezone={timezone}
        language={language}
      />
    </div>
  );
}
