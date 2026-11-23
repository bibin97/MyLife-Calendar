import { describe, it, expect } from 'vitest';
import { isLeapYear, isDateAllowed, getTodayKeyInTimezone } from '../src/utils/dateValidator.js';

describe('Calendar Engine & Future Date Restrictions', () => {
  it('correctly calculates leap years according to the Gregorian calendar', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
    expect(isLeapYear(2000)).toBe(true); // Divisible by 400
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // Century year not divisible by 400
    expect(isLeapYear(2100)).toBe(false);
  });

  it('allows past dates and rejects future dates based on current timezone', () => {
    const today = getTodayKeyInTimezone('Asia/Kolkata');
    expect(today).toBeDefined();
    expect(typeof today).toBe('string');
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Today is always allowed
    expect(isDateAllowed(today, 'Asia/Kolkata')).toBe(true);

    // A past date (e.g. 2020-01-01) is allowed
    expect(isDateAllowed('2020-01-01', 'Asia/Kolkata')).toBe(true);

    // A distant future date (e.g. 2099-12-31) must be rejected
    expect(isDateAllowed('2099-12-31', 'Asia/Kolkata')).toBe(false);

    // Malformed date strings must be rejected
    expect(isDateAllowed('invalid-date', 'Asia/Kolkata')).toBe(false);
    expect(isDateAllowed('', 'Asia/Kolkata')).toBe(false);
    expect(isDateAllowed(null, 'Asia/Kolkata')).toBe(false);
  });

  it('rejects dates beyond tomorrow', () => {
    const today = getTodayKeyInTimezone('Asia/Kolkata');
    const [year, month, day] = today.split('-').map(Number);
    const tomorrowDate = new Date(year, month - 1, day + 1);
    const tomorrowKey = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    expect(isDateAllowed(tomorrowKey, 'Asia/Kolkata')).toBe(false);
  });
});
