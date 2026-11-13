// Utility to generate Google Calendar links and Apple / Outlook .ics calendar invites

export function formatIcsDate(dateStr, timeStr) {
  try {
    const [year, month, day] = (dateStr || '').split('-').map(Number);
    const [hour, min] = (timeStr || '10:00').split(':').map(Number);
    if (!year || !month || !day) return null;
    const d = new Date(Date.UTC(year, month - 1, day, hour || 10, min || 0, 0));
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (e) {
    return null;
  }
}

export function getGoogleCalendarUrl(event) {
  if (!event) return '#';
  try {
    const title = encodeURIComponent(event.title || 'Community Event');
    const details = encodeURIComponent(`${event.description || ''}\n\nOrganised on more. (https://morecommunity.app)`);
    const location = encodeURIComponent(event.location || 'Meeting Point provided by host');
    
    const start = formatIcsDate(event.date, event.time);
    let end = start;
    if (start) {
      // Default to 2 hours duration
      const [year, month, day] = (event.date || '').split('-').map(Number);
      const [hour, min] = (event.time || '10:00').split(':').map(Number);
      const endDate = new Date(Date.UTC(year, month - 1, day, (hour || 10) + 2, min || 0, 0));
      end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    const dates = start && end ? `${start}/${end}` : '';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}${dates ? `&dates=${dates}` : ''}`;
  } catch (e) {
    return '#';
  }
}

export function generateIcsDataUri(event) {
  if (!event) return '';
  try {
    const start = formatIcsDate(event.date, event.time) || '20261115T100000Z';
    const [year, month, day] = (event.date || '').split('-').map(Number);
    const [hour, min] = (event.time || '10:00').split(':').map(Number);
    const endDate = new Date(Date.UTC(year || 2026, (month || 11) - 1, day || 15, (hour || 10) + 2, min || 0, 0));
    const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//More Community//morecommunity.app//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@morecommunity.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${(event.title || 'Community Event').replace(/\n/g, ' ')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${(event.location || 'Meeting Point').replace(/\n/g, ' ')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
  } catch (e) {
    return '';
  }
}
