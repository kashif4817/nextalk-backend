import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

export const getBlockedUsers = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("blocked_users")
    .select(
      `id, created_at,
      blocked:blocked_id (
        id, username, display_name, avatar_url
      )`
    )
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error) return sendResponse(res, 500, "Failed to fetch blocked users", null);

  return sendResponse(res, 200, "Blocked users fetched", data);
});

export const blockUser = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { blocked_id } = req.body;

  if (!blocked_id) return sendResponse(res, 400, "blocked_id is required");
  if (blocked_id === id)
    return sendResponse(res, 400, "You cannot block yourself");

  // Check if target user exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", blocked_id)
    .single();

  if (profileError || !profile)
    return sendResponse(res, 404, "User not found", null);

  // Remove from contacts (both directions) before blocking
  await supabase
    .from("contacts")
    .delete()
    .or(
      `and(user_id.eq.${id},contact_id.eq.${blocked_id}),and(user_id.eq.${blocked_id},contact_id.eq.${id})`
    );

  const { data, error } = await supabase
    .from("blocked_users")
    .insert({ blocker_id: id, blocked_id })
    .select(
      `id, created_at,
      blocked:blocked_id (
        id, username, display_name, avatar_url
      )`
    )
    .single();

  if (error) {
    if (error.code === "23505")
      return sendResponse(res, 409, "User already blocked");
    return sendResponse(res, 500, "Internal Server error", null);
  }

  return sendResponse(res, 201, "User blocked", data);
});

export const unblockUser = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: blockRowId } = req.params; // this is the blocked_users row id

  const { data, error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("id", blockRowId)       // match the row by its primary key
    .eq("blocker_id", id)       // ensure the requester owns this block
    .select("id");

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data || data.length === 0)
    return sendResponse(res, 404, "Block not found", null);

  return sendResponse(res, 200, "User unblocked", null);
});