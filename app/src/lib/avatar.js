export function getSilhouetteAvatar() {
  return '/images/default-avatar.svg';
}

export function getDefaultAvatar(name = 'User') {
  if (!name || name === 'User' || name === 'Member' || name === 'New User' || name === 'Unknown') {
    return '/images/default-avatar.svg';
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=21726c&color=fff&size=200&bold=true`;
}

export function resolveUserAvatar(user, fallbackName) {
  if (user?.avatar && !user.avatar.includes('pravatar.cc') && !user.avatar.includes('photo-1534528741775-53994a69daeb')) {
    return user.avatar;
  }
  const name = user?.name || fallbackName;
  return getDefaultAvatar(name);
}
