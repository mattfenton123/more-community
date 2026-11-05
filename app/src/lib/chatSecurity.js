// More Community - Chat Trust & Safety Engine
// Protects members and leaders from malicious links, URL shorteners, phishing, and off-platform scams.

export const TRUSTED_PLATFORMS = [
  'morecommunity.app',
  'localhost',
  'google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'waze.com',
  'citymapper.com',
  'what3words.com',
  'apple.com',
  'maps.apple.com',
  'strava.com',
  'komoot.com',
  'alltrails.com',
  'parkrun.org.uk',
  'parkrun.com',
  'ordnancesurvey.co.uk',
  'nationaltrust.org.uk',
  'woodlandtrust.org.uk',
  'ramblers.org.uk',
  'instagram.com',
  'instagr.am',
  'youtube.com',
  'youtu.be',
  'spotify.com',
  'open.spotify.com',
  'linkedin.com',
  'facebook.com',
  'fb.me',
  'whatsapp.com',
  'chat.whatsapp.com',
  'wa.me',
  'wikipedia.org',
  'en.wikipedia.org',
  'bbc.co.uk',
  'gov.uk',
  'nhs.uk',
  'eventbrite.co.uk',
  'eventbrite.com',
  'meetup.com',
  'ticketmaster.co.uk'
];

export const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'is.gd',
  'ow.ly',
  'buff.ly',
  'rebrand.ly',
  'shorturl.at',
  'tiny.cc',
  'qr.ae',
  'v.gd',
  'bl.ink',
  'soo.gd',
  'adf.ly'
];

export const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.buzz',
  '.click',
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.work',
  '.cam',
  '.rest',
  '.icu',
  '.link',
  '.club',
  '.monster',
  '.space',
  '.sbs',
  '.cfd'
];

export const SCAM_KEYWORDS = [
  'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'usdt', 'wallet address',
  'seed phrase', 'private key', 'guaranteed profit', 'investment return',
  'binance', 'coinbase transfer', 'forex', 'doubling money',
  'cashapp', 'venmo', 'wire money', 'western union', 'gift card',
  'pay me via paypal friends', 'revolut tag', 'bank transfer to account',
  'account suspended', 'claim your prize', 'you have won', 'verify your password',
  'urgent login required', 'security verification link', 'free gift',
  'add my snap', 'dm me on telegram', 't.me/', 'message me on snapchat'
];

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`[\]]+/gi;

export function extractUrls(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(URL_REGEX) || [];
  return Array.from(new Set(matches)).map(raw => {
    let normalized = raw;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    normalized = normalized.replace(/[.,;:!?]+$/, '');
    return normalized;
  });
}

export function analyzeLink(rawUrl) {
  let normalized = rawUrl;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  normalized = normalized.replace(/[.,;:!?]+$/, '');

  let urlObj;
  try {
    urlObj = new URL(normalized);
  } catch (e) {
    return {
      url: normalized,
      hostname: 'invalid-url',
      status: 'high_risk',
      riskScore: 90,
      badge: 'Malformed Link',
      color: '#ef4444',
      isHttps: false,
      reasons: ['The URL structure appears invalid or malformed.']
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const isHttps = urlObj.protocol === 'https:';
  const reasons = [];
  let riskScore = 0;
  let status = 'safe';
  let badge = 'External Link';
  let color = '#38bdf8';

  if (hostname === 'morecommunity.app' || hostname === 'localhost') {
    return {
      url: normalized,
      hostname,
      status: 'verified',
      riskScore: 0,
      badge: 'More Community Official',
      color: '#14b8a6',
      isHttps: true,
      reasons: ['Official More Community platform destination.']
    };
  }

  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpAddress) {
    riskScore += 80;
    reasons.push('Direct numerical IP address instead of registered domain name.');
  }

  const isTrusted = TRUSTED_PLATFORMS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  if (isTrusted) {
    if (hostname.includes('strava') || hostname.includes('komoot') || hostname.includes('alltrails') || hostname.includes('parkrun')) {
      badge = 'Verified Activity Link';
    } else if (hostname.includes('maps') || hostname.includes('google') || hostname.includes('waze') || hostname.includes('what3words')) {
      badge = 'Verified Location & Maps';
    } else if (hostname.includes('whatsapp') || hostname.includes('instagram') || hostname.includes('spotify') || hostname.includes('youtube')) {
      badge = 'Verified Social Platform';
    } else {
      badge = 'Verified Platform';
    }
    return {
      url: normalized,
      hostname,
      status: 'verified',
      riskScore: 0,
      badge,
      color: '#10b981',
      isHttps,
      reasons: ['Destination is on the More Community verified platform whitelist.']
    };
  }

  const isShortener = URL_SHORTENERS.some(short => hostname === short || hostname.endsWith('.' + short));
  if (isShortener) {
    riskScore += 50;
    badge = 'Caution: URL Shortener';
    color = '#f59e0b';
    reasons.push('This link uses a shortening service that conceals the true final destination.');
  }

  const hasSuspiciousTld = SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld));
  if (hasSuspiciousTld) {
    riskScore += 40;
    reasons.push(`Uses a domain extension (${hostname.slice(hostname.lastIndexOf('.'))}) frequently used in automated spam.`);
  }

  if (!isHttps) {
    riskScore += 30;
    reasons.push('Unencrypted connection (HTTP instead of HTTPS). Information may not be private.');
  }

  if (riskScore >= 70) {
    status = 'high_risk';
    badge = 'High Risk Warning';
    color = '#ef4444';
  } else if (riskScore >= 35) {
    status = 'caution';
    badge = isShortener ? 'Caution: Masked URL' : 'Caution: Unverified';
    color = '#f59e0b';
  } else {
    status = 'standard_external';
    badge = 'External Website';
    color = '#38bdf8';
    reasons.push('External website outside More Community. Exercise standard online care.');
  }

  return {
    url: normalized,
    hostname,
    status,
    riskScore,
    badge,
    color,
    isHttps,
    isShortener,
    reasons
  };
}

export function scanMessageForScam(text) {
  if (!text || typeof text !== 'string') return { isSuspicious: false, matches: [] };
  const lower = text.toLowerCase();
  const matchedKeywords = [];

  for (const keyword of SCAM_KEYWORDS) {
    if (lower.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  }

  const isSuspicious = matchedKeywords.length > 0;
  let cautionMessage = null;

  if (isSuspicious) {
    if (matchedKeywords.some(k => ['crypto', 'bitcoin', 'btc', 'ethereum', 'wallet address', 'binance'].includes(k))) {
      cautionMessage = 'Shield Guard Notice: Cryptocurrency or speculative investment discussions are not covered by community protection.';
    } else if (matchedKeywords.some(k => ['cashapp', 'venmo', 'wire money', 'gift card', 'western union'].includes(k))) {
      cautionMessage = 'Shield Guard Warning: Never send direct wire transfers or off-platform money to individuals. Keep all event bookings within More Community.';
    } else if (matchedKeywords.some(k => ['telegram', 't.me/', 'snapchat'].includes(k))) {
      cautionMessage = 'Trust Tip: Someone is asking to move off More Community to an unmoderated app. Exercise caution before sharing contact info.';
    } else {
      cautionMessage = 'Trust & Safety Notice: Please verify the identity of the person you are chatting with before sharing sensitive details.';
    }
  }

  return {
    isSuspicious,
    matchedKeywords,
    cautionMessage
  };
}

export function calculateUserTrustLevel(targetUser, memberships = {}, events = [], rsvps = []) {
  if (!targetUser) return { level: 'New Member', badgeColor: '#94a3b8', isVerified: false, score: 0 };

  const isLeader = targetUser.role === 'Leader' || (targetUser.ledCommunities && targetUser.ledCommunities.length > 0);
  const isSpecialist = Boolean(targetUser.isSpecialist || targetUser.specialistTitle || targetUser.verifiedSpecialist);
  
  const attendedCount = (rsvps || []).filter(r => r.userId === targetUser.id && (r.status === 'checked_in' || r.checkedIn)).length;
  const rsvpCount = (rsvps || []).filter(r => r.userId === targetUser.id && r.status === 'going').length;

  if (isLeader) {
    return {
      level: 'Community Leader',
      badge: '👑 Leader Pro Protected',
      badgeColor: '#14b8a6',
      isVerified: true,
      description: 'Verified community leader covered by Leader Shield insurance.',
      score: 100
    };
  }

  if (isSpecialist) {
    return {
      level: 'Verified Specialist',
      badge: '🛡️ Accredited Specialist',
      badgeColor: '#3b82f6',
      isVerified: true,
      description: 'Accredited host with verified professional credentials & DBS/PLI.',
      score: 90
    };
  }

  if (attendedCount >= 3 || rsvpCount >= 5) {
    return {
      level: 'Established Member',
      badge: '⭐ Active Member',
      badgeColor: '#10b981',
      isVerified: true,
      description: `Attended ${attendedCount} events in person with local communities.`,
      score: 75
    };
  }

  return {
    level: 'New Member',
    badge: '🌱 New Community Member',
    badgeColor: '#94a3b8',
    isVerified: false,
    description: 'Recently joined More Community. Exercise standard safety precautions.',
    score: 30
  };
}

const messageTimestamps = new Map();

export function checkRateLimit(userId) {
  if (!userId) return { allowed: true };
  const now = Date.now();
  const windowMs = 8000;
  const maxMessages = 5;

  const userHistory = messageTimestamps.get(userId) || [];
  const recent = userHistory.filter(t => now - t < windowMs);

  if (recent.length >= maxMessages) {
    const coolDownSecs = Math.ceil((windowMs - (now - recent[0])) / 1000);
    return {
      allowed: false,
      coolDownSecs,
      message: `Slow down! Please wait ${coolDownSecs}s before sending another message.`
    };
  }

  recent.push(now);
  messageTimestamps.set(userId, recent);
  return { allowed: true };
}
