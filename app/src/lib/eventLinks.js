/**
 * eventLinks.js
 * Human-friendly event URLs, e.g.
 *   /events/bewl-water-community-walk-31st-october-2026
 * instead of
 *   /events/b7b283ef-3646-4c32-96ec-e7d2a1ec943a
 *
 * The slug is derived from the event title + date, so no database column is
 * required. Old UUID links keep working: every lookup tries the raw id first
 * and the event page rewrites the address bar to the clean URL.
 *
 * Pure functions only (safe to import from server and client components).
 */

export const SITE_ORIGIN = 'https://www.morecommunity.app';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const SLUG_DATE_RE = new RegExp(
  `-(\\d{1,2})(?:st|nd|rd|th)-(${MONTHS.join('|')})-(\\d{4})(?:-[a-z0-9]{6})?$`
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value) {
  return UUID_RE.test(String(value || ''));
}

function ordinalSuffix(n) {
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/** "Bewl Water: Community Walk!" -> "bewl-water-community-walk" */
export function slugify(text, maxLength = 60) {
  const slug = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/g, '');
}

function getDateParts(dateStr) {
  if (!dateStr) return null;
  const iso = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { year: +iso[1], month: +iso[2] - 1, day: +iso[3] };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** "bewl-water-community-walk-31st-october-2026" (no collision handling) */
export function getEventBaseSlug(event) {
  const title = slugify(event?.title) || 'event';
  const parts = getDateParts(event?.date);
  if (!parts || parts.month < 0 || parts.month > 11) return title;
  return `${title}-${parts.day}${ordinalSuffix(parts.day)}-${MONTHS[parts.month]}-${parts.year}`;
}

/**
 * Slug used in the URL. If another known event would produce the same slug
 * (same title, same day) a short id suffix keeps both links unique.
 */
export function getEventSlug(event, allEvents) {
  const base = getEventBaseSlug(event);
  if (!allEvents || !event?.id) return base;
  const clash = allEvents.some(e => e.id !== event.id && getEventBaseSlug(e) === base);
  return clash ? `${base}-${String(event.id).replace(/-/g, '').slice(0, 6).toLowerCase()}` : base;
}

export function getEventPath(event, allEvents) {
  return `/events/${getEventSlug(event, allEvents)}`;
}

/** Absolute, shareable URL. Pass `origin` on the client to keep dev/preview hosts working. */
export function getEventUrl(event, { allEvents, origin, ref } = {}) {
  const url = `${origin || SITE_ORIGIN}${getEventPath(event, allEvents)}`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
}

/** True if `param` (from the URL) refers to `event` by slug. Case-insensitive. */
export function eventMatchesSlug(event, param) {
  if (!event || !param) return false;
  const p = String(param).toLowerCase();
  const base = getEventBaseSlug(event);
  if (p === base) return true;
  return !!event.id && p === `${base}-${String(event.id).replace(/-/g, '').slice(0, 6).toLowerCase()}`;
}

/** Find an event in a list by raw id (legacy links) or by clean slug. */
export function findEventByParam(events, param) {
  if (!param || !Array.isArray(events)) return null;
  const byId = events.find(e => e.id === param);
  if (byId) return byId;
  return events.find(e => eventMatchesSlug(e, param)) || null;
}

/** Pull the YYYY-MM-DD date back out of a slug, so servers can narrow their query. */
export function parseSlugDate(slug) {
  const m = String(slug || '').toLowerCase().match(SLUG_DATE_RE);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]) + 1;
  return `${m[3]}-${String(month).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
}
