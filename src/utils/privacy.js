// utils/privacy.js
async function canSee(viewerId, targetId, field) {
  if (viewerId === targetId) return true
  if (await isBlocked(targetId, viewerId)) return false  // target blocked viewer

  const privacy = await getPrivacySetting(targetId, field)
  if (privacy === 'everyone') return true
  if (privacy === 'nobody')   return false
  if (privacy === 'contacts') return await isInContacts(targetId, viewerId)
  return false
}

// Usage inside getUserProfile:
const canSeeAvatar  = await canSee(me, target, 'profile_photo_privacy')
const canSeeAbout   = await canSee(me, target, 'about_privacy')
const canSeeLastSeen = await canSee(me, target, 'last_seen_privacy')

return {
  id: target.id,
  username: target.username,          // always visible
  display_name: target.display_name,  // always visible
  avatar_url: canSeeAvatar  ? target.avatar_url : null,
  about:      canSeeAbout   ? target.about       : null,
  last_seen:  canSeeLastSeen ? target.last_seen  : null,
  is_online:  canSeeLastSeen ? target.is_online  : false,
}