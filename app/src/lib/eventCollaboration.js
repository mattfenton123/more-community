import { resolveUserAvatar } from './avatar.js';

export function getCollabCommunityIds(event) {
  if (!event) return [];
  const raw = Array.isArray(event.collabCommunityIds)
    ? event.collabCommunityIds
    : (Array.isArray(event.cohost_community_ids) ? event.cohost_community_ids : []);
  return raw.filter(Boolean);
}

/**
 * True when the user already belongs to the event's primary host community OR
 * any co-hosting partner community.
 */
export function isHostOrPartnerMember(user, event) {
  if (!user || !event) return false;
  const joined = Array.isArray(user.joinedCommunities) ? user.joinedCommunities : [];
  if (event.communityId && joined.includes(event.communityId)) return true;
  return getCollabCommunityIds(event).some(cid => joined.includes(cid));
}

/**
 * Only auto-join the primary host community during RSVP when the user is
 * neither a primary member nor a member of any co-hosting partner community.
 */
export function shouldAutoJoinPrimaryOnRsvp({ user, event, isGoing, isPendingApproval }) {
  if (!user?.id || !event?.communityId) return false;
  if (isGoing || isPendingApproval) return false;
  return !isHostOrPartnerMember(user, event);
}

/**
 * True for platform admins and Leaders/Co-Leaders of either the primary host
 * community or any co-hosting partner community.
 */
export function isEventHostOrCohostLeader(user, event) {
  if (!user || !event) return false;
  if (user.isAdmin) return true;
  const led = Array.isArray(user.ledCommunities) ? user.ledCommunities : [];
  if (event.communityId && led.includes(event.communityId)) return true;
  return getCollabCommunityIds(event).some(cid => led.includes(cid));
}

export function buildEventCommentsByEvent(commentRows = [], usersList = []) {
  const userById = {};
  (usersList || []).forEach(u => {
    if (u?.id) userById[u.id] = u;
  });

  const map = {};
  (commentRows || []).forEach(row => {
    if (!row?.event_id) return;
    if (!map[row.event_id]) map[row.event_id] = [];
    const author = userById[row.author_id];
    const authorName = author?.name || author?.full_name || 'Community Member';
    map[row.event_id].push({
      id: row.id,
      eventId: row.event_id,
      authorId: row.author_id,
      authorName,
      authorAvatar: resolveUserAvatar(author, authorName),
      text: row.text || '',
      createdAt: row.created_at || null,
    });
  });

  Object.keys(map).forEach(evId => {
    map[evId].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  });

  return map;
}

function findCommunityRole(memberships = {}, community, userId) {
  if (!community || !userId) return null;
  if (community.leader_id === userId || community.creator_id === userId) return 'Leader';
  const rows = memberships[community.id] || [];
  const mem = rows.find(m => (m.userId || m.user_id) === userId);
  return mem?.role || null;
}

export function getCommentAuthorAffiliation({
  authorId,
  event,
  communities = [],
  communityMemberships = {},
  goingUserIds = [],
}) {
  const isGoing = Array.isArray(goingUserIds) && goingUserIds.includes(authorId);
  if (!authorId || !event) {
    return { badgeLabel: null, badgeTone: null, isGoing };
  }

  const primaryComm = (communities || []).find(c => c.id === event.communityId);
  const cohostIds = getCollabCommunityIds(event);
  const partnerComms = (communities || []).filter(c => cohostIds.includes(c.id));

  const primaryRole = findCommunityRole(communityMemberships, primaryComm, authorId);
  if (primaryRole === 'Leader' || primaryRole === 'Co-Leader') {
    return { badgeLabel: 'Host', badgeTone: 'host', isGoing };
  }

  for (const partner of partnerComms) {
    const partnerRole = findCommunityRole(communityMemberships, partner, authorId);
    if (partnerRole === 'Leader' || partnerRole === 'Co-Leader') {
      return { badgeLabel: 'Co-Host', badgeTone: 'cohost', isGoing };
    }
  }

  if (cohostIds.length > 0) {
    if (primaryRole && primaryComm?.name) {
      return { badgeLabel: primaryComm.name, badgeTone: 'community', isGoing };
    }
    for (const partner of partnerComms) {
      if (findCommunityRole(communityMemberships, partner, authorId)) {
        return { badgeLabel: partner.name, badgeTone: 'partner', isGoing };
      }
    }
  }

  return { badgeLabel: null, badgeTone: null, isGoing };
}
