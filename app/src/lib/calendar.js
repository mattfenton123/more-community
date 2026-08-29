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

function parseDateTime(dateStr, timeStr) {
  try {
    let d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Fallback if date parsing fails, use today
      d = new Date();
    }
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridian = timeMatch[3]?.toLowerCase();
        
        if (meridian === 'pm' && hours < 12) hours += 12;
        if (meridian === 'am' && hours === 12) hours = 0;
        
        d.setHours(hours, minutes, 0, 0);
      }
    }
    return d;
  } catch (e) {
    console.warn("Could not parse date", dateStr, timeStr);
  }
  return new Date();
}
