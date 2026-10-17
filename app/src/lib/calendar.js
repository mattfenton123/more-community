export function downloadIcs(event, communityName) {
  const startTime = parseDateTime(event.date, event.time);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours duration

  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//more. Community//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@morecommunity.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startTime)}`,
    `DTEND:${formatDate(endTime)}`,
    `SUMMARY:${event.title} - ${communityName}`,
    `DESCRIPTION:${event.description || ''}\\n\\nView on more.: https://www.morecommunity.app/events/${event.id}`,
    `LOCATION:${event.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getCalendarFeedUrls(communityId) {
  if (typeof window === 'undefined') return { webcal: '', google: '', http: '' };
  const origin = window.location.origin;
  const host = window.location.host;
  const httpUrl = `${origin}/api/calendar/${communityId}`;
  const webcalUrl = `webcal://${host}/api/calendar/${communityId}`;
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;
  return { webcal: webcalUrl, google: googleUrl, http: httpUrl };
}

export function getGoogleCalendarEventUrl(event, communityName) {
  const startTime = parseEventDateTime(event.date, event.time) || new Date();
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const startStr = formatDate(startTime);
  const endStr = formatDate(endTime);
  const title = encodeURIComponent(`${event.title} - ${communityName || 'more. Community'}`);
  const details = encodeURIComponent(`${event.description || ''}\n\nJoin on more.: https://www.morecommunity.app/events/${event.id}`);
  const location = encodeURIComponent(event.location || '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

export function getWhatsAppShareUrl(event, communityName) {
  const text = encodeURIComponent(
    `Hey everyone! I'm attending ${event.title}${communityName ? ` with ${communityName}` : ''}! 🎉\n\n` +
    `📅 ${event.date} at ${event.time || '10:00'}\n` +
    `📍 ${event.location || 'Location on map'}\n\n` +
    `Come join me: https://www.morecommunity.app/events/${event.id}`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
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

