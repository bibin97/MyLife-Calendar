import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date key YYYY-MM-DD in the given timezone
 */
export const getTodayKeyInTimezone = (timezone = DEFAULT_TIMEZONE) => {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return format(zoned, 'yyyy-MM-dd');
};

/**
 * Validates if the selectedDate (YYYY-MM-DD) is allowed (i.e. not in future)
 */
export const isDateAllowed = (dateString, timezone = DEFAULT_TIMEZONE) => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const todayKey = getTodayKeyInTimezone(timezone);
  // Lexicographical comparison works accurately for ISO YYYY-MM-DD
  return dateString <= todayKey;
};

/**
 * Leap year checker
 */
export const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};
