/**
 * Shared helpers for encoding/decoding Private Side-Group metadata in `channels.type`
 * without requiring a schema migration, while also supporting `channels.member_ids` if present.
 *
 * Encoded format for private side-groups:
 *   "group|c=<creatorId>|m=<id1>,<id2>,<id3>"
 *
 * Standard open channels keep simple values: "text", "announcement".
 */

export function encodeChannelType(type = 'text', memberIds = null, creatorId = null) {
  const cleanIds = Array.isArray(memberIds)
    ? Array.from(new Set(memberIds.map((id) => String(id || '').trim()).filter(Boolean)))
    : [];

  if (type === 'group' || cleanIds.length > 0) {
    if (cleanIds.length === 0) return 'group';
    const safeCreator = creatorId ? String(creatorId).trim() : '';
    return `group|c=${safeCreator}|m=${cleanIds.join(',')}`;
  }
  return type || 'text';
}

export function parseChannel(ch) {
  if (!ch || typeof ch !== 'object') return null;

  const rawType = String(ch.type || 'text');
  const existingMemberIds = Array.isArray(ch.member_ids)
    ? ch.member_ids.map((id) => String(id || '').trim()).filter(Boolean)
    : Array.isArray(ch.memberIds)
      ? ch.memberIds.map((id) => String(id || '').trim()).filter(Boolean)
      : [];

  let channelType = rawType;
  let creatorId = ch.creatorId || null;
  let parsedMemberIds = [...existingMemberIds];

  if (rawType.startsWith('group|')) {
    channelType = 'group';
    const parts = rawType.split('|').slice(1);
    for (const part of parts) {
      if (part.startsWith('c=')) {
        const val = part.slice(2).trim();
        if (val) creatorId = val;
      } else if (part.startsWith('m=')) {
        const ids = part
          .slice(2)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        parsedMemberIds = Array.from(new Set([...parsedMemberIds, ...ids]));
      }
    }
  } else if (rawType === 'group') {
    channelType = 'group';
  }

  const isPrivateGroup = channelType === 'group' || parsedMemberIds.length > 0;

  return {
    ...ch,
    community_id: ch.community_id || ch.communityId,
    communityId: ch.communityId || ch.community_id,
    rawType,
    channelType: isPrivateGroup ? 'group' : channelType || 'text',
    isPrivateGroup,
    member_ids: isPrivateGroup ? parsedMemberIds : null,
    memberIds: isPrivateGroup ? parsedMemberIds : null,
    creatorId,
  };
}

export function isCommunityMemberGroupsAllowed(communityRow) {
  if (!communityRow || typeof communityRow !== 'object') return true;

  if (communityRow.allow_member_groups !== undefined) {
    return Boolean(communityRow.allow_member_groups);
  }
  if (communityRow.allowMemberGroups !== undefined) {
    return Boolean(communityRow.allowMemberGroups);
  }

  const rawTags = Array.isArray(communityRow.tags) ? communityRow.tags : [];
  const cfgTag = rawTags.find((t) => typeof t === 'string' && t.startsWith('__cfg:'));
  if (cfgTag) {
    const pairs = cfgTag.replace('__cfg:', '').split(',');
    for (const pair of pairs) {
      const [k, v] = pair.split('=');
      if (k === 'member_groups') {
        return v === '1' || v === 'true';
      }
    }
  }

  const rawLinks = Array.isArray(communityRow.external_links) ? communityRow.external_links : [];
  const dbSettings = rawLinks.find((item) => item && item.__type === 'community_settings');
  if (dbSettings && dbSettings.allow_member_groups !== undefined) {
    return Boolean(dbSettings.allow_member_groups);
  }

  return true;
}
