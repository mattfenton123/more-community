// Helpers for Multi-Town Chapter visibility and founder approval governance

export function isCommunityPendingChapter(community) {
  return community?.chapter_status === 'pending_approval';
}

export function isCommunityDeclinedChapter(community) {
  return community?.chapter_status === 'declined';
}

export function isCommunityPubliclyListed(community) {
  if (!community) return false;
  if (community.is_banned) return false;
  if (community.chapter_status === 'pending_approval') return false;
  if (community.chapter_status === 'declined') return false;
  return true;
}

export function getRootCommunityId(community) {
  if (!community) return null;
  return community.parent_community_id || community.id;
}

export function canViewPendingChapter(community, user, communities = []) {
  if (!community || !user?.id) return false;
  if (user.isAdmin) return true;
  if (community.leader_id === user.id) return true;
  if (community.parent_community_id) {
    const parent = communities.find(c => c.id === community.parent_community_id);
    if (parent && parent.leader_id === user.id) return true;
  }
  return false;
}

export function isFoundingLeaderOfChapter(community, user, communities = []) {
  if (!community?.parent_community_id || !user?.id) return false;
  if (user.isAdmin) return true;
  const parent = communities.find(c => c.id === community.parent_community_id);
  return Boolean(parent && parent.leader_id === user.id);
}
