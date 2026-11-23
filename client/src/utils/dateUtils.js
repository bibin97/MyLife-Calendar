import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns the current date in the specified timezone
 */
export const getNowInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();
  try {
    return toZonedTime(now, timezone);
  } catch {
    return now;
  }
};

/**
 * Formats a date object to YYYY-MM-DD in the specified timezone
 */
export const toDateKey = (date, timezone = DEFAULT_TIMEZONE) => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const zoned = toZonedTime(date, timezone);
  return format(zoned, 'yyyy-MM-dd');
};

/**
 * Checks if a given year is a leap year
 */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Strict future date check against today in user timezone.
 * Returns true if dateKey is strictly greater than todayKey.
 */
export const isDateInFuture = (dateInput, timezone = DEFAULT_TIMEZONE) => {
  const targetKey = toDateKey(dateInput, timezone);
  const todayKey = toDateKey(getNowInTimezone(timezone), timezone);
  return targetKey > todayKey;
};

/**
 * Checks if a given date is today in the user timezone
 */
export const isDateToday = (dateInput, timezone = DEFAULT_TIMEZONE) => {
  const targetKey = toDateKey(dateInput, timezone);
  const todayKey = toDateKey(getNowInTimezone(timezone), timezone);
  return targetKey === todayKey;
};

/**
 * Generates all calendar days to display for a month (including edge filler days)
 */
export const getMonthCalendarGrid = (currentMonthDate) => {
  const monthStart = startOfMonth(currentMonthDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((day) => ({
    date: day,
    dateKey: format(day, 'yyyy-MM-dd'),
    dayNumber: format(day, 'd'),
    isCurrentMonth: isSameMonth(day, monthStart)
  }));
};

/**
 * Formats date for display in English or Malayalam
 */
export const formatDisplayDate = (dateInput, language = 'en', timezone = DEFAULT_TIMEZONE) => {
  const dateObj = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
  const zoned = toZonedTime(dateObj, timezone);

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsMl = [
    'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
    'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
  ];

  const day = format(zoned, 'd');
  const monthIndex = zoned.getMonth();
  const year = format(zoned, 'yyyy');

  if (language === 'ml') {
    return `${year} ${monthsMl[monthIndex]} ${day}`;
  }
  return `${day} ${monthsEn[monthIndex]} ${year}`;
};

/**
 * Formats time with seconds (e.g. 8:45:32 PM)
 */
export const formatDisplayTime = (dateInput, timezone = DEFAULT_TIMEZONE) => {
  if (!dateInput) return '';
  const dateObj = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const zoned = toZonedTime(dateObj, timezone);
  return format(zoned, 'hh:mm:ss a');
};
