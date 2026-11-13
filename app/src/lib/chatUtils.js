/**
 * Pure helper utilities for community chat, DMs, timestamps, and permissions.
 */

export function getChatTimestampMs(row) {
  if (!row) return 0;
  const raw = typeof row === 'object' ? (row.createdAt || row.created_at || row.timestamp) : row;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function formatChatTime(row, nowInput = null) {
  if (!row) return '';
  const raw = typeof row === 'object' ? (row.createdAt || row.created_at || row.timestamp) : row;
  if (!raw) return '';

  if (typeof raw === 'string' && !raw.includes('-') && !raw.includes('T')) {
    return raw.trim();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return typeof raw === 'string' ? raw.split(' ')[0] : '';
  }

  const now = nowInput ? new Date(nowInput) : new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMsgDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfMsgDay) / 86400000);

  if (diffDays === 0) {
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return parsed.toLocaleDateString([], { weekday: 'short' });
  }
  return parsed.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function isCommunityChatLeader(userOrId, community, memberships = []) {
  if (!userOrId || !community) return false;
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  if (!userId) return false;

  const userObj = typeof userOrId === 'object' ? userOrId : null;
  const communityId = community.id;

  if (community.leader_id === userId || community.leaderId === userId) {
    return true;
  }

  if (Array.isArray(userObj?.ledCommunities) && userObj.ledCommunities.includes(communityId)) {
    return true;
  }

  if (Array.isArray(memberships)) {
    const match = memberships.find((m) => (m.userId || m.user_id) === userId);
    const role = (match?.role || '').trim().toLowerCase();
    if (role === 'leader' || role === 'co-leader') {
      return true;
    }
  }

  return false;
}

export function canManageCommunityChat(user, community, memberships = []) {
  if (!user || !user.id || !community) return false;
  if (user.isAdmin || user.is_admin) return true;
  return isCommunityChatLeader(user, community, memberships);
}

export function getManageableCommunities(communities = [], user = null, communityMemberships = {}) {
  if (!user || !user.id || !Array.isArray(communities)) return [];
  if (user.isAdmin || user.is_admin) {
    return communities;
  }
  return communities.filter((community) =>
    isCommunityChatLeader(user, community, communityMemberships?.[community.id] || [])
  );
}
