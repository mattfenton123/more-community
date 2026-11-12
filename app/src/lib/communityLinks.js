/**
 * communityLinks.js
 * Clean, human-friendly community slugs, e.g.
 *   /community/more-shades-of-golden
 *   /dashboard?community=more-shades-of-golden
 * instead of random 5-character suffixes like
 *   more-shades-of-golden-0rhnh
 *
 * Old suffixed IDs continue to resolve seamlessly so existing shared links never break.
 */

export function slugifyCommunityName(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Strips a trailing 5-char random suffix from legacy IDs (e.g. "more-shades-of-golden-0rhnh" -> "more-shades-of-golden")
 */
export function stripLegacyIdSuffix(id) {
  if (!id) return '';
  return String(id).replace(/-[a-z0-9]{5}$/i, '');
}

/**
 * Returns the canonical clean slug for a community.
 */
export function getCommunitySlug(community, allCommunities) {
  if (!community) return '';
  if (community.id === 'more-leaders-network') return 'more-leaders-network';

  const fromName = slugifyCommunityName(community.name);
  const fromId = stripLegacyIdSuffix(community.id);
  const base = fromName || fromId || community.id;

  if (!Array.isArray(allCommunities) || !community.id) return base;
  const clash = allCommunities.some(
    c => c.id !== community.id && (slugifyCommunityName(c.name) === base || stripLegacyIdSuffix(c.id) === base)
  );
  return clash ? community.id : base;
}

export function getCommunityPath(community, allCommunities) {
  if (typeof community === 'string') {
    return `/community/${stripLegacyIdSuffix(community)}`;
  }
  return `/community/${getCommunitySlug(community, allCommunities)}`;
}

export function communityMatchesParam(community, param) {
  if (!community || !param) return false;
  const p = String(param).toLowerCase().trim();
  if (String(community.id || '').toLowerCase() === p) return true;
  if (stripLegacyIdSuffix(community.id).toLowerCase() === p) return true;
  if (slugifyCommunityName(community.name) === p) return true;
  return false;
}

export function findCommunityByParam(communities, param) {
  if (!param || !Array.isArray(communities)) return null;
  const exact = communities.find(c => c.id === param);
  if (exact) return exact;
  return communities.find(c => communityMatchesParam(c, param)) || null;
}
