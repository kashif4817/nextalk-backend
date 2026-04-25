import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";


export const getMe = asyncHandler(async (req, res) => {
  const id = req.user.id;

  // Get profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, about, avatar_url, is_online, last_seen, created_at"
    )
    .eq("id", id)
    .single();

  if (profileError) return sendResponse(res, 500, "Internal Server error", null);
  if (!profile) return sendResponse(res, 404, "No user found", null);

  // Get email from auth — req.user comes from your JWT middleware
  // and already has the auth user object, so just pull it from there
  const email = req.user.email ?? null;

  return sendResponse(res, 200, "User found", { ...profile, email });
});


export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) return sendResponse(res, 400, "No userId provided");

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, about, avatar_url, is_online, last_seen, created_at"
    )
    .eq("id", id)
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "No user found", null);
  return sendResponse(res, 200, "User found", data);
});



export const searchUsers = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const search = req.query.search;
  console.log(search);

  if (!search) return sendResponse(res, 400, "No query provided");

  // profiles has no email column — search by username and display_name only
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_online")
    .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);

  if (error) return sendResponse(res, 500, "Internal Server error", null);

  // Exclude users who have blocked the requester or been blocked by them
  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${id},blocked_id.eq.${id}`);

  if (blocksError) return sendResponse(res, 500, "Internal Server error", null);

  const excludeIds = new Set(
    blocks.flatMap((b) => [b.blocker_id, b.blocked_id])
  );

  const filtered = data.filter(
    (user) => !excludeIds.has(user.id) && user.id !== id
  );

  return sendResponse(res, 200, "Users found", filtered);
});


export const updateProfile = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { display_name, about, avatar_url } = req.body;

  if (!display_name && !about && !avatar_url)
    return sendResponse(res, 400, "No fields provided to update");

  const updates = {};
  if (display_name !== undefined) updates.display_name = display_name;
  if (about !== undefined) updates.about = about;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select("id, username, display_name, about, avatar_url, updated_at")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "User not found", null);
  return sendResponse(res, 200, "Profile updated", data);
});


export const setUsername = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { username } = req.body;

  if (!username) {
    return sendResponse(res, 400, "Username is required");
  }

  // Normalize input
  const cleanUsername = username.trim().toLowerCase();

  // Validation rules
  const isValidUsername = (value) => {
    if (value.length < 3 || value.length > 15) return false;

    // only letters, numbers, dot, underscore
    if (!/^[a-z0-9._]+$/.test(value)) return false;

    // no consecutive dots or underscores
    if (value.includes("..") || value.includes("__")) return false;

    // cannot start/end with dot or underscore
    if (
      value.startsWith(".") ||
      value.endsWith(".") ||
      value.startsWith("_") ||
      value.endsWith("_")
    ) {
      return false;
    }

    return true;
  };

  if (!isValidUsername(cleanUsername)) {
    return sendResponse(
      res,
      400,
      "Invalid username (3–15 chars, letters/numbers/._ only, no consecutive symbols, no leading/trailing dot or underscore)"
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      username: cleanUsername,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, username, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return sendResponse(res, 409, "Username already taken");
    }
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!data) {
    return sendResponse(res, 404, "User not found", null);
  }

  return sendResponse(res, 200, "Username updated", data);
});