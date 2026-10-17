/**
 * recurrence.js
 * Comprehensive scheduling & recurrence utilities for More Community events.
 * Supports:
 * - Single events
 * - Weekly recurring (e.g. every Saturday)
 * - Bi-weekly recurring (e.g. every 2 weeks)
 * - Monthly on same day of the month (e.g. 15th of every month)
 * - Monthly on same weekday pattern (e.g. 1st Saturday of the month)
 * - Weekdays (Mon-Fri)
 * - Custom variety of dates (multi-date selection)
 */

/**
 * Format a 'YYYY-MM-DD' string into a friendly British date string.
 * e.g. "Sat, 24 Oct 2026"
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get weekday name for a date string
 */
export function getWeekdayName(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-GB', { weekday: 'long' });
  } catch {
    return '';
  }
}

/**
 * Determine ordinal of weekday in month (e.g., 1st, 2nd, 3rd, 4th, or last Saturday)
 */
export function getWeekdayOrdinalInfo(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const weekday = d.getDay();
  const weekdayName = d.toLocaleDateString('en-GB', { weekday: 'long' });

  // Count how many of this weekday occurred before this date in the month
  let count = 1;
  let cur = day - 7;
  while (cur > 0) {
    count++;
    cur -= 7;
  }

  // Check if it's the last one in this month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const isLast = (day + 7) > lastDayOfMonth;

  const ordinalWord = count === 1 ? '1st' : count === 2 ? '2nd' : count === 3 ? '3rd' : count === 4 ? '4th' : '5th';

  return {
    weekday,
    weekdayName,
    ordinal: count,
    ordinalWord,
    isLast,
    dayOfMonth: day
  };
}

/**
 * Find the Nth weekday in a given year and month (0-indexed month)
 */
function findNthWeekday(year, month, targetWeekday, ordinal, isLast = false) {
  const lastDay = new Date(year, month + 1, 0).getDate();

  if (isLast) {
    // Search backward from last day
    for (let day = lastDay; day >= 1; day--) {
      const d = new Date(year, month, day);
      if (d.getDay() === targetWeekday) {
        return padZero(year, 4) + '-' + padZero(month + 1, 2) + '-' + padZero(day, 2);
      }
    }
  }

  let matchCount = 0;
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day);
    if (d.getDay() === targetWeekday) {
      matchCount++;
      if (matchCount === ordinal) {
        return padZero(year, 4) + '-' + padZero(month + 1, 2) + '-' + padZero(day, 2);
      }
    }
  }

  // If ordinal was 5 but month only had 4, fall back to last matching weekday
  for (let day = lastDay; day >= 1; day--) {
    const d = new Date(year, month, day);
    if (d.getDay() === targetWeekday) {
      return padZero(year, 4) + '-' + padZero(month + 1, 2) + '-' + padZero(day, 2);
    }
  }

  return null;
}

function padZero(num, len = 2) {
  return String(num).padStart(len, '0');
}

function toISODate(d) {
  return padZero(d.getFullYear(), 4) + '-' + padZero(d.getMonth() + 1, 2) + '-' + padZero(d.getDate(), 2);
}

/**
 * Generate a list of recurring dates based on configuration.
 *
 * @param {Object} options
 * @param {string} options.startDate - 'YYYY-MM-DD'
 * @param {string} options.frequency - 'none' | 'weekly' | 'biweekly' | 'monthly_weekday' | 'monthly_date' | 'weekdays' | 'custom'
 * @param {string} options.endType - 'count' | 'until'
 * @param {number} options.count - Number of occurrences (default 6, max 52)
 * @param {string} options.untilDate - 'YYYY-MM-DD'
 * @param {string[]} options.customDates - List of custom 'YYYY-MM-DD' strings
 * @param {string[]} options.excludedDates - List of 'YYYY-MM-DD' removed by user
 * @returns {string[]} Array of 'YYYY-MM-DD'
 */
export function generateEventDates({
  startDate,
  frequency = 'none',
  endType = 'count',
  count = 6,
  untilDate = '',
  customDates = [],
  excludedDates = []
}) {
  if (frequency === 'custom') {
    const all = new Set();
    if (startDate) all.add(startDate);
    (customDates || []).forEach(d => { if (d) all.add(d); });
    const excluded = new Set(excludedDates || []);
    return Array.from(all)
      .filter(d => !excluded.has(d))
      .sort();
  }

  if (!startDate) return [];
  if (frequency === 'none') {
    return [startDate];
  }

  const parts = startDate.split('-');
  if (parts.length !== 3) return [startDate];

  const startYear = parseInt(parts[0], 10);
  const startMonth = parseInt(parts[1], 10) - 1;
  const startDay = parseInt(parts[2], 10);

  const maxLimit = Math.min(Math.max(parseInt(count, 10) || 1, 1), 52);
  const until = (endType === 'until' && untilDate) ? new Date(untilDate + 'T23:59:59') : null;

  const dates = [];
  const excludedSet = new Set(excludedDates || []);

  const ordinalInfo = (frequency === 'monthly_weekday') ? getWeekdayOrdinalInfo(startDate) : null;

  let current = new Date(startYear, startMonth, startDay);
  let iterations = 0;
  const MAX_SAFETY = 200;

  while (dates.length < maxLimit && iterations < MAX_SAFETY) {
    iterations++;

    let dateStr = '';

    if (dates.length === 0) {
      dateStr = startDate;
    } else if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7);
      dateStr = toISODate(current);
    } else if (frequency === 'biweekly') {
      current.setDate(current.getDate() + 14);
      dateStr = toISODate(current);
    } else if (frequency === 'weekdays') {
      do {
        current.setDate(current.getDate() + 1);
      } while (current.getDay() === 0 || current.getDay() === 6);
      dateStr = toISODate(current);
    } else if (frequency === 'monthly_date') {
      const targetMonth = startMonth + dates.length;
      const targetYear = startYear + Math.floor(targetMonth / 12);
      const modMonth = targetMonth % 12;
      const lastDayOfTargetMonth = new Date(targetYear, modMonth + 1, 0).getDate();
      const clampedDay = Math.min(startDay, lastDayOfTargetMonth);
      dateStr = padZero(targetYear, 4) + '-' + padZero(modMonth + 1, 2) + '-' + padZero(clampedDay, 2);
    } else if (frequency === 'monthly_weekday') {
      const targetMonth = startMonth + dates.length;
      const targetYear = startYear + Math.floor(targetMonth / 12);
      const modMonth = targetMonth % 12;
      dateStr = findNthWeekday(targetYear, modMonth, ordinalInfo.weekday, ordinalInfo.ordinal, ordinalInfo.isLast);
    }

    if (!dateStr) break;

    // Check end condition
    if (until) {
      const candDate = new Date(dateStr + 'T00:00:00');
      if (candDate > until) break;
    }

    if (!excludedSet.has(dateStr)) {
      dates.push(dateStr);
    }
  }

  return dates;
}

/**
 * Returns a human-friendly description of the schedule.
 */
export function getRecurrenceDescription({
  frequency,
  startDate,
  count,
  endType,
  untilDate,
  totalDates = 1
}) {
  if (frequency === 'none' || totalDates <= 1) {
    return 'Single event';
  }

  if (frequency === 'custom') {
    return `Series of ${totalDates} selected dates`;
  }

  const weekday = getWeekdayName(startDate);
  const ordinal = getWeekdayOrdinalInfo(startDate);

  let freqLabel = '';
  if (frequency === 'weekly') {
    freqLabel = `Every week on ${weekday}s`;
  } else if (frequency === 'biweekly') {
    freqLabel = `Every 2 weeks on ${weekday}s`;
  } else if (frequency === 'monthly_weekday' && ordinal) {
    freqLabel = `Monthly on the ${ordinal.ordinalWord} ${ordinal.weekdayName}`;
  } else if (frequency === 'monthly_date' && ordinal) {
    freqLabel = `Monthly on the ${ordinal.dayOfMonth}th`;
  } else if (frequency === 'weekdays') {
    freqLabel = `Every weekday (Mon–Fri)`;
  }

  if (endType === 'until' && untilDate) {
    return `${freqLabel} until ${formatEventDate(untilDate)} (${totalDates} sessions)`;
  }

  return `${freqLabel} (${totalDates} sessions)`;
}
