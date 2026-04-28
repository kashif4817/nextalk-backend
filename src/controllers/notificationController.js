import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

const DEFAULT_LIMIT = 20;

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  const cursor = req.query.cursor || null;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);

  const { data, error } = await query;

  if (error) return sendResponse(res, 500, "Internal Server error", null);

  return sendResponse(res, 200, "Notifications fetched", {
    notifications: data,
    next_cursor: data.length === limit ? data[data.length - 1].created_at : null,
  });
});


export const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "All notifications marked as read");
});


export const markOneRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, is_read")
    .maybeSingle();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Notification not found", null);
  return sendResponse(res, 200, "Notification marked as read", data);
});
