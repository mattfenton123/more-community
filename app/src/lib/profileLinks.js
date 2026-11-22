/**
 * profileLinks.js
 * Clean, human-friendly member profile slugs, e.g.
 *   /profile/dale-smith
 * instead of raw Supabase UUIDs like
 *   /profile/550e8400-e29b-41d4-a716-446655440000
 *
 * Raw UUIDs continue to resolve seamlessly so legacy links never break.
 */

export function slugifyProfileName(name) {
  let raw = String(name || '').trim();
  // Never leak full email domains in URL slugs if a user's name defaulted to their email
  if (raw.includes('@')) {
    raw = raw.split('@')[0];
  }
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function shortIdSuffix(id) {
  return String(id || '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 4)
    .toLowerCase();
}

/**
 * Returns the canonical clean, collision-proof slug for a user profile, e.g.
 *   dale-smith-a3f1
 * Always includes a deterministic 4-char suffix from the user's UUID (LinkedIn style)
 * so saved QR codes and shared links never break even if another user with the same name joins later.
 */
export function getProfileSlug(userObj) {
  if (!userObj) return '';
  const base = slugifyProfileName(userObj.name);
  if (!base) return userObj.id || '';

  const suffix = shortIdSuffix(userObj.id);
  return suffix ? `${base}-${suffix}` : base;
}

export function getProfilePath(userObj, allUsers) {
  if (!userObj) return '/profile';
  if (typeof userObj === 'string') {
    const matched = Array.isArray(allUsers) ? allUsers.find((u) => u.id === userObj) : null;
    if (matched) return `/profile/${getProfileSlug(matched, allUsers)}`;
    return `/profile/${userObj}`;
  }
  return `/profile/${getProfileSlug(userObj, allUsers)}`;
}

/**
 * Resolves a route param (clean slug, suffixed slug, or raw UUID) back to the matching user object.
 */
export function findUserByParam(users, param, currentUser = null) {
  if (!param) return currentUser || null;
  const decoded = decodeURIComponent(String(param)).trim();
  const lower = decoded.toLowerCase();
  const list = Array.isArray(users) ? users : [];

  // 1. Exact ID match (UUID or legacy ID)
  const byId = list.find((u) => u?.id === decoded);
  if (byId) return byId;
  if (currentUser?.id === decoded) return currentUser;

  // 2. Canonical slug match (handles both unique slugs and disambiguated `-xxxx` slugs)
  const bySlug = list.find((u) => u && getProfileSlug(u, list).toLowerCase() === lower);
  if (bySlug) return bySlug;
  if (currentUser && getProfileSlug(currentUser, list).toLowerCase() === lower) return currentUser;

  // 3. Base name slug match (fallback if user list wasn't fully loaded when link was created)
  const byName = list.find((u) => u && slugifyProfileName(u.name) === lower);
  if (byName) return byName;
  if (currentUser && slugifyProfileName(currentUser.name) === lower) return currentUser;

  return null;
}
