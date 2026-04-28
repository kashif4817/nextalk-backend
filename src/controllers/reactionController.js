import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

// ─── Seen ────────────────────────────────────────────────────────────────────

export const markSeen = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, deleted_for_everyone_at")
    .eq("id", messageId)
    .single();

  if (msgError || !message) return sendResponse(res, 404, "Message not found");
  if (message.deleted_for_everyone_at) return sendResponse(res, 400, "Message deleted");
  if (message.sender_id === userId) return sendResponse(res, 400, "Cannot mark your own message as seen");

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) return sendResponse(res, 500, "Internal Server error", null);
  if (!membership) return sendResponse(res, 403, "Not a member of this conversation");

  // Respect sender's read_receipts_privacy setting
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("read_receipts_privacy")
    .eq("id", message.sender_id)
    .maybeSingle();

  if (senderProfile?.read_receipts_privacy === "nobody")
    return sendResponse(res, 200, "Read receipts disabled by sender");

  const { error } = await supabase
    .from("message_seen_by")
    .upsert({ message_id: messageId, user_id: userId, seen_at: new Date().toISOString() }, { onConflict: "message_id,user_id" });

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Marked as seen");
});


export const getSeenBy = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .single();

  if (msgError || !message) return sendResponse(res, 404, "Message not found");

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) return sendResponse(res, 500, "Internal Server error", null);
  if (!membership) return sendResponse(res, 403, "Not a member of this conversation");

  const { data, error } = await supabase
    .from("message_seen_by")
    .select(`
      seen_at,
      profile:user_id (
        id, username, display_name, avatar_url
      )
    `)
    .eq("message_id", messageId);

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Seen by", data);
});


// ─── Reactions ───────────────────────────────────────────────────────────────

export const reactToMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) return sendResponse(res, 400, "emoji is required");

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, conversation_id, deleted_for_everyone_at")
    .eq("id", messageId)
    .single();

  if (msgError || !message) return sendResponse(res, 404, "Message not found");
  if (message.deleted_for_everyone_at) return sendResponse(res, 400, "Cannot react to a deleted message");

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) return sendResponse(res, 500, "Internal Server error", null);
  if (!membership) return sendResponse(res, 403, "Not a member of this conversation");

  const { data, error } = await supabase
    .from("message_reactions")
    .upsert({ message_id: messageId, user_id: userId, emoji }, { onConflict: "message_id,user_id,emoji" })
    .select("id, emoji, user_id")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 201, "Reaction added", data);
});


export const removeReaction = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) return sendResponse(res, 400, "emoji is required");

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji);

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Reaction removed");
});


export const getReactions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .single();

  if (msgError || !message) return sendResponse(res, 404, "Message not found");

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) return sendResponse(res, 500, "Internal Server error", null);
  if (!membership) return sendResponse(res, 403, "Not a member of this conversation");

  const { data, error } = await supabase
    .from("message_reactions")
    .select(`
      id, emoji,
      profile:user_id (
        id, username, display_name, avatar_url
      )
    `)
    .eq("message_id", messageId);

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Reactions", data);
});


// ─── Starred ─────────────────────────────────────────────────────────────────

export const getStarredMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("starred_messages")
    .select(`
      id, created_at,
      message:message_id (
        id, conversation_id, sender_id, message_type, content,
        file_url, file_type, created_at,
        sender:sender_id (
          id, username, display_name, avatar_url
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Starred messages", data);
});


export const starMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;

  const { data: message, error: msgError } = await supabase
    .from("messages")
    .select("id, conversation_id, deleted_for_everyone_at")
    .eq("id", messageId)
    .single();

  if (msgError || !message) return sendResponse(res, 404, "Message not found");
  if (message.deleted_for_everyone_at) return sendResponse(res, 400, "Cannot star a deleted message");

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) return sendResponse(res, 500, "Internal Server error", null);
  if (!membership) return sendResponse(res, 403, "Not a member of this conversation");

  const { error } = await supabase
    .from("starred_messages")
    .upsert({ message_id: messageId, user_id: userId }, { onConflict: "user_id,message_id" });

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 201, "Message starred");
});


export const unstarMessage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: messageId } = req.params;

  const { error } = await supabase
    .from("starred_messages")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId);

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Message unstarred");
});
