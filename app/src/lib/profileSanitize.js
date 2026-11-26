const PROFILE_META_PREFIX = '__profile_meta:';

const INTERNAL_BIO_TAG_REGEX = /\[(Email|Source|Event|Payment|Waiver|Answer|InvitedBy|Town)\s*:[^\]]*\]/gi;

const SYSTEM_INTEREST_EXACT = new Set([
  'guest',
  'walk_in',
  'waiver_signed',
  'plus_one',
  'subscriber',
]);

const SYSTEM_INTEREST_PREFIXES = [
  PROFILE_META_PREFIX,
  'email:',
  'opt_in:',
  'town:',
  'source:',
];

/**
 * Strips internal system metadata tokens (e.g. `[Email: ...] [Source: guest_rsvp] [Event: ...]`)
 * that legacy guest RSVP / subscriber records stored in `users.bio`.
 */
export function sanitizeUserBio(rawBio) {
  if (typeof rawBio !== 'string') return '';
  const cleaned = rawBio
    .replace(INTERNAL_BIO_TAG_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

/**
 * Returns true if an entry in `users.interests` is an internal system/tracking tag
 * rather than a user-facing interest.
 */
export function isSystemInterestTag(tag) {
  if (typeof tag !== 'string') return true;
  const trimmed = tag.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();
  if (SYSTEM_INTEREST_EXACT.has(lower)) return true;
  return SYSTEM_INTEREST_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Filters internal metadata/tracking tags out of `users.interests`.
 */
export function sanitizeUserInterests(rawInterests) {
  if (!Array.isArray(rawInterests)) return [];
  return rawInterests
    .filter((item) => typeof item === 'string' && !isSystemInterestTag(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Extracts an internal/guest email from a user record (supports both legacy
 * `[Email: ...]` bio / `email:...` interest records and `__profile_meta:` records).
 * Intended for admin tools and server-side email reminders — never display publicly.
 */
export function extractInternalEmail(u) {
  if (!u) return '';
  if (u._guestEmail) return String(u._guestEmail).trim();
  if (u.email) return String(u.email).trim();

  if (Array.isArray(u.interests)) {
    for (const item of u.interests) {
      if (typeof item !== 'string') continue;
      if (item.startsWith(PROFILE_META_PREFIX)) {
        try {
          const parsed = JSON.parse(item.slice(PROFILE_META_PREFIX.length));
          if (parsed?.guest_email) return String(parsed.guest_email).trim();
        } catch {}
      } else if (item.toLowerCase().startsWith('email:')) {
        return item.slice(6).trim();
      }
    }
  }

  const bioMatch = (u.bio || '').match(/\[Email:\s*([^\]]+)\]/i);
  if (bioMatch?.[1]) return bioMatch[1].trim();

  return '';
}

/**
 * Formats `profileUser.joined` cleanly, including legacy `"Joined Nov 2026"` strings
 * that `new Date(...)` would otherwise fail to parse.
 */
export function formatMemberSince(joined) {
  if (!joined || typeof joined !== 'string') return 'June 2025';
  const stripped = joined.replace(/^Joined\s+/i, '').trim();
  if (!stripped) return 'June 2025';
  const directDate = new Date(stripped);
  if (!isNaN(directDate.getTime())) {
    return directDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  const dayPrefixed = new Date(`1 ${stripped}`);
  if (!isNaN(dayPrefixed.getTime())) {
    return dayPrefixed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  return stripped;
}
