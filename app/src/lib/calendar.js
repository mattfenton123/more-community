export function downloadIcs(event, communityName) {
  const startTime = parseDateTime(event.date, event.time);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours duration

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//more. community//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@more-community.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${event.title} - ${communityName}`,
    `DESCRIPTION:${event.description || ''}\\n\\nView on more.: https://more-community.vercel.app/event/${event.id}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\\r\\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    let d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    if (isNaN(d.getTime())) {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return null;

    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridian = timeMatch[3]?.toLowerCase();
        
        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;
        
        d.setHours(hours, minutes, 0, 0);
      } else {
        d.setHours(23, 59, 59, 999);
      }
    } else {
      // Default to end of the day so events happening today stay "Upcoming" for the full day
      d.setHours(23, 59, 59, 999);
    }
    return d;
  } catch (e) {
    return null;
  }
}

export function isEventUpcoming(eventOrDate, optionalTime) {
  const dateStr = typeof eventOrDate === 'string' ? eventOrDate : eventOrDate?.date;
  const timeStr = optionalTime || (typeof eventOrDate === 'object' ? eventOrDate?.time : null);
  const dt = parseEventDateTime(dateStr, timeStr);
  if (!dt) return false;
  return dt >= new Date();
}

export function isEventPast(eventOrDate, optionalTime) {
  return !isEventUpcoming(eventOrDate, optionalTime);
}

function parseDateTime(dateStr, timeStr) {
  return parseEventDateTime(dateStr, timeStr) || new Date();
}

