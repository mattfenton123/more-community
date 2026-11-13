export function isAffiliateExperience(item) {
  if (!item) return false;
  if (item.bookingModel === 'affiliate_host_pass') return true;
  if (item.productUrl && String(item.productUrl).trim()) return true;
  const prov = `${item.provider || ''} ${item.source || ''}`.toLowerCase();
  return prov.includes('viator') || prov.includes('tourradar');
}

export function parseExperienceMeta(description = '') {
  if (!description || typeof description !== 'string') return null;
  const match = description.match(/<!--META:(.*?)-->/);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}

export function stripExperienceMeta(description = '') {
  if (!description || typeof description !== 'string') return '';
  return description
    .replace(/<!--META:.*?-->/g, '')
    .trim();
}

export function buildAffiliateUrl(productUrl, { communityId, leaderId, experienceId, eventId } = {}) {
  if (!productUrl) return '';
  try {
    const url = new URL(productUrl);
    const safeComm = String(communityId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeTarget = String(eventId || experienceId || 'exp').replace(/[^a-zA-Z0-9_-]/g, '');
    const campaign = `more_${safeComm}_${safeTarget}`.slice(0, 64);

    if (!url.searchParams.has('campaign')) {
      url.searchParams.set('campaign', campaign);
    }
    url.searchParams.set('utm_source', 'morecommunity');
    url.searchParams.set('utm_medium', leaderId ? `leader_${String(leaderId).slice(0, 12)}` : 'community_leader');
    url.searchParams.set('utm_campaign', safeComm);
    return url.toString();
  } catch (e) {
    return productUrl;
  }
}

export function getHostPassEconomics({ guidePrice = 35, hostPassMember = 15, minGroupSize = 6 } = {}) {
  const safeGuide = Math.max(0, Number(guidePrice) || 0);
  const safePass = Math.max(0, Number(hostPassMember) || 0);
  const safeMin = Math.max(2, Number(minGroupSize) || 6);
  const pot = safePass * safeMin;
  const platformFee = Math.round(pot * 0.10);
  const netToHost = Math.max(0, pot - platformFee);
  const coversLeaderTicket = netToHost >= safeGuide;
  const leaderNetAfterOwnTicket = netToHost - safeGuide;

  return {
    guidePrice: safeGuide,
    hostPassMember: safePass,
    minGroupSize: safeMin,
    pot,
    platformFee,
    netToHost,
    coversLeaderTicket,
    leaderNetAfterOwnTicket,
  };
}
