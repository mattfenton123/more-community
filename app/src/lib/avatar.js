export const SILHOUETTE_AVATAR = '/images/default-avatar.svg';

const AVATAR_PALETTE = [
  '#21726C',
  '#0D8B93',
  '#0F766E',
  '#115E59',
  '#0E7490',
  '#1D4ED8',
  '#4338CA',
  '#7C3AED',
];

const GENERIC_NAMES = new Set([
  '',
  'user',
  'member',
  'new user',
  'unknown',
  'unknown user',
  'community member',
  'guest',
]);

export function getSilhouetteAvatar() {
  return SILHOUETTE_AVATAR;
}

export function getInitials(name = '') {
  const raw = String(name || '').trim();
  if (!raw || GENERIC_NAMES.has(raw.toLowerCase())) {
    return '';
  }

  // Handle email fallback like alex.cole@morecommunity.app nicely
  const base = raw.includes('@') ? raw.split('@')[0] : raw;
  const parts = base
    .replace(/[^\p{L}\p{N}\s._-]/gu, ' ')
    .split(/[\s._-]+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function pickAvatarBg(name = '') {
  const key = String(name || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function isPlaceholderAvatar(url) {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.includes('/images/default-avatar.svg')) return true;
  if (trimmed.includes('pravatar.cc') && !/[?&]img=/i.test(trimmed)) return true;
  if (trimmed.includes('ui-avatars.com/api/')) return true;
  if (trimmed.includes('api.dicebear.com/7.x/initials')) return true;
  if (trimmed.includes('photo-1534528741775-53994a69daeb')) return true;
  return false;
}

export function getInitialsAvatarSvgDataUri(name = '') {
  const initials = getInitials(name);
  if (!initials) {
    return SILHOUETTE_AVATAR;
  }
  const safeInitials = initials
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const bg = pickAvatarBg(name);
  const fontSize = initials.length === 1 ? 74 : 62;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><circle cx="80" cy="80" r="80" fill="${bg}"/><text x="50%" y="52%" dominant-baseline="central" text-anchor="middle" fill="#FFFFFF" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="2">${safeInitials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getDefaultAvatar(name = 'User') {
  return getInitialsAvatarSvgDataUri(name);
}

export function resolveUserAvatar(user, fallbackName) {
  const rawAvatar = typeof user === 'string' ? user : (user?.avatar || user?.avatar_url);
  if (rawAvatar && !isPlaceholderAvatar(rawAvatar)) {
    return rawAvatar;
  }
  const name = (typeof user === 'object' ? (user?.name || user?.full_name) : '') || fallbackName || '';
  return getDefaultAvatar(name);
}
