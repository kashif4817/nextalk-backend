import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

export const getMe = asyncHandler(async (req, res) => {
  const id = req.user.id;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "No user found", null);
  return sendResponse(res, 200, "User found", data);
});

// TODO: Phase 2 - apply canSee() privacy filter before returning
export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) return sendResponse(res, 400, "No userId provided");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "No user found", null);
  return sendResponse(res, 200, "User found", data);
});

export const searchUsers = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const search = req.query.search;

  if (!search) return sendResponse(res, 400, "No query provided");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, email, display_name")
    .or(
      `username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`
    );

  if (error) return sendResponse(res, 500, "Internal Server error", null);

  const { data: blocks, error: blocksError } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${id},blocked_id.eq.${id}`);

  if (blocksError) return sendResponse(res, 500, "Internal Server error", null);

  const excludeIds = blocks.flatMap((b) => [b.blocker_id, b.blocked_id]);
  const filtered = data.filter(
    (user) => !excludeIds.includes(user.id) && user.id !== id
  );

  return sendResponse(res, 200, "Users found", filtered);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { display_name, about, avatar_url } = req.body;

  // At least one field must be provided
  if (!display_name && !about && !avatar_url) {
    return sendResponse(res, 400, "No fields provided to update");
  }

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

  if (!username) return sendResponse(res, 400, "Username is required");

  // Mirror your DB constraint on the server side for a clean error message
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (username.length < 3) {
    return sendResponse(res, 400, "Username must be at least 3 characters");
  }
  if (!usernameRegex.test(username)) {
    return sendResponse(
      res,
      400,
      "Username can only contain letters, numbers, underscores, and dots"
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, username, updated_at")
    .single();

  if (error) {
    // Supabase unique constraint violation code
    if (error.code === "23505") {
      return sendResponse(res, 409, "Username already taken");
    }
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!data) return sendResponse(res, 404, "User not found", null);
  return sendResponse(res, 200, "Username updated", data);
});