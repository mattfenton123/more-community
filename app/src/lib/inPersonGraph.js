import { isEventPast } from './calendar';
import { resolveUserAvatar } from './avatar';

/**
 * Returns true if an RSVP record represents a verified check-in.
 */
export function isCheckedInRsvp(rsvp) {
  if (!rsvp) return false;
  return Boolean(rsvp.checkedIn || rsvp.checked_in || rsvp.status === 'checked_in');
}

/**
 * Returns true if an RSVP record represents confirmed attendance
 * (explicit check-in, OR marked 'going' for an event that has already taken place).
 */
export function isAttendedRsvp(rsvp, event) {
  if (!rsvp) return false;
  if (isCheckedInRsvp(rsvp)) return true;
  if (rsvp.status === 'going' && event && isEventPast(event)) return true;
  return false;
}

/**
 * Returns the list of events where BOTH userAId and userBId attended in person.
 */
export function getSharedMeetups(userAId, userBId, events = [], eventRsvps = {}) {
  if (!userAId || !userBId || userAId === userBId) return [];
  const shared = [];
  for (const ev of events || []) {
    if (!ev?.id || ev.status === 'cancelled' || ev.status === 'proposed') continue;
    const rsvps = eventRsvps?.[ev.id] || [];
    const rA = rsvps.find((r) => (r.userId || r.user_id) === userAId);
    const rB = rsvps.find((r) => (r.userId || r.user_id) === userBId);
    if (isAttendedRsvp(rA, ev) && isAttendedRsvp(rB, ev)) {
      shared.push(ev);
    }
  }
  return shared;
}

/**
 * Builds a Map<otherUserId, sharedEventCount> for everyone viewerId has met in person.
 */
export function getMetInPersonMap(viewerId, events = [], eventRsvps = {}) {
  const map = new Map();
  if (!viewerId) return map;

  for (const ev of events || []) {
    if (!ev?.id || ev.status === 'cancelled' || ev.status === 'proposed') continue;
    const rsvps = eventRsvps?.[ev.id] || [];
    const viewerRsvp = rsvps.find((r) => (r.userId || r.user_id) === viewerId);
    if (!isAttendedRsvp(viewerRsvp, ev)) continue;

    for (const r of rsvps) {
      const uid = r.userId || r.user_id;
      if (!uid || uid === viewerId) continue;
      if (isAttendedRsvp(r, ev)) {
        map.set(uid, (map.get(uid) || 0) + 1);
      }
    }
  }
  return map;
}

/**
 * Returns familiar faces (people viewerId has previously met in person) who are Going to eventId.
 */
export function getFamiliarFacesGoing(viewerId, eventId, events = [], eventRsvps = {}, users = [], precomputedMetMap = null) {
  if (!viewerId || !eventId) return [];
  const metMap = precomputedMetMap || getMetInPersonMap(viewerId, events, eventRsvps);
  if (metMap.size === 0) return [];

  const rsvps = eventRsvps?.[eventId] || [];
  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const familiar = [];

  for (const r of rsvps) {
    const uid = r.userId || r.user_id;
    if (!uid || uid === viewerId) continue;
    if (r.status !== 'going' && !isCheckedInRsvp(r)) continue;
    const sharedCount = metMap.get(uid);
    if (!sharedCount) continue;

    const u = userMap.get(uid);
    familiar.push({
      id: uid,
      name: u?.name || r.guestName || 'Member',
      avatar: resolveUserAvatar(u || { name: r.guestName || 'Member' }),
      sharedCount,
    });
  }

  return familiar.sort((a, b) => b.sharedCount - a.sharedCount);
}

/**
 * Returns true if userId has 0 prior attended events in communityId (excluding currentEventId).
 */
export function isCommunityFirstTimer(userId, communityId, currentEventId, events = [], eventRsvps = {}) {
  if (!userId || !communityId) return false;
  for (const ev of events || []) {
    if (!ev?.id || ev.id === currentEventId) continue;
    if (ev.communityId !== communityId || ev.status === 'cancelled' || ev.status === 'proposed') continue;
    const rsvps = eventRsvps?.[ev.id] || [];
    const r = rsvps.find((x) => (x.userId || x.user_id) === userId);
    if (isAttendedRsvp(r, ev)) {
      return false;
    }
  }
  return true;
}

/**
 * Returns total explicit verified check-ins for a user across all events.
 */
export function getVerifiedCheckInCount(userId, eventRsvps = {}) {
  if (!userId) return 0;
  let count = 0;
  for (const list of Object.values(eventRsvps || {})) {
    if (!Array.isArray(list)) continue;
    if (list.some((r) => (r.userId || r.user_id) === userId && isCheckedInRsvp(r))) {
      count += 1;
    }
  }
  return count;
}

/**
 * Extracts an optional Venue Perk tag from an event description:
 *   [Venue Perk: 10% off coffee at The Roastery]
 */
export function extractVenuePerk(rawDesc = '') {
  const match = String(rawDesc || '').match(/\[Venue Perk:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : '';
}

/**
 * Finds the most recent "We're Here" arrival beacon posted in an event's comments
 * (prefixed with "[We're Here]") within the last 18 hours.
 */
export const ARRIVAL_BEACON_PREFIX = "[We're Here]";

export function getLatestArrivalBeacon(comments = [], maxAgeHours = 18) {
  if (!Array.isArray(comments) || comments.length === 0) return null;
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const beacons = comments
    .filter((c) => {
      const txt = String(c?.text || c?.content || '').trim();
      if (!txt.startsWith(ARRIVAL_BEACON_PREFIX)) return false;
      const ts = new Date(c.createdAt || c.created_at || 0).getTime();
      return Number.isNaN(ts) || ts >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.created_at || 0).getTime() -
        new Date(a.createdAt || a.created_at || 0).getTime()
    );

  if (beacons.length === 0) return null;
  const latest = beacons[0];
  const raw = String(latest.text || latest.content || '').trim();
  return {
    ...latest,
    message: raw.slice(ARRIVAL_BEACON_PREFIX.length).trim(),
  };
}
