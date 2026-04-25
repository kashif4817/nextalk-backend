// utils/privacy.js

// - Privacy filter (canSee) — implement before v1.0 deploy (Phase 11)
import supabase from "../config/supabase";

const isBlocked = async (targetId, viewerId) => {
  if (!targetId || !viewerId) return sendResponse(res, "No id proviede");

  const { data, error } = await supabase
    .from("blocked_users")
    .select("*")
    .eq("blocker_id", targetId)
    .eq("blocked_id", viewerId);
  if (error) return true;
  if (data.length === 0) return false;  //Not bloked
  if (data.length >= 1) return true;    //blocked
};

const isInContacts = async (targetId, viewerId) => {
  if (!targetId || !viewerId) return sendResponse(res, "No id provieded");

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", targetId)
    .eq("contact_id", viewerId);
  if (error) return true;
  if (data.length === 0) return false; //not a contact
  if (data.length >= 1) return true;    // is a contact
};

const getPrivacySetting = async (targetId, field) => {
  if (!targetId) return sendResponse(res, "No id provieded");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetId);
  if (error) return true;
  if (data) return data[0][field];
};

async function canSee(viewerId, targetId, field) {
  if (viewerId === targetId) return true;
  if (await isBlocked(targetId, viewerId)) return false; // target blocked viewer

  const privacy = await getPrivacySetting(targetId, field);
  if (privacy === "everyone") return true;
  if (privacy === "nobody") return false;
  if (privacy === "contacts") return await isInContacts(targetId, viewerId);
  return false;
}

// Usage inside getUserProfile:
const canSeeAvatar = await canSee(me, target, "profile_photo_privacy");
const canSeeAbout = await canSee(me, target, "about_privacy");
const canSeeLastSeen = await canSee(me, target, "last_seen_privacy");

return {
  id: target.id,
  username: target.username, // always visible
  display_name: target.display_name, // always visible
  avatar_url: canSeeAvatar ? target.avatar_url : null,
  about: canSeeAbout ? target.about : null,
  last_seen: canSeeLastSeen ? target.last_seen : null,
  is_online: canSeeLastSeen ? target.is_online : false,
};
