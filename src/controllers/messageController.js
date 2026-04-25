import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

const DEFAULT_LIMIT = 30;
const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes


export const getMessages = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { convId } = req.params;
  const limit = parseInt(req.query.limit) || DEFAULT_LIMIT;
  const cursor = req.query.cursor || null; // created_at of oldest loaded message

  // Verify membership + get cleared_at
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("cleared_at")
    .eq("conversation_id", convId)
    .eq("user_id", id)
    .is("left_at", null)
    .is("removed_at", null)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this conversation");

  let query = supabase
    .from("messages")
    .select(
      `id, conversation_id, sender_id, message_type, content, file_url,
      file_type, edited_at, is_pinned, is_forwarded, created_at,
      reply_to:reply_to_id (
        id, content, message_type, sender_id
      ),
      reactions:message_reactions (
        id, emoji, user_id
      ),
      seen_by:message_seen_by (
        user_id, seen_at
      ),
      sender:sender_id (
        id, username, display_name, avatar_url
      )`
    )
    .eq("conversation_id", convId)
    .is("deleted_for_everyone_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Cursor pagination — load older messages
  if (cursor) query = query.lt("created_at", cursor);

  // Respect cleared_at — don't show messages before user cleared chat
  if (membership.cleared_at) query = query.gt("created_at", membership.cleared_at);

  const { data, error } = await query;
  if (error) return sendResponse(res, 500, "Internal Server error", null);

  // Filter out messages deleted for this user
  const filtered = data.filter((msg) => !msg.deleted_for_me_at);

  return sendResponse(res, 200, "Messages fetched", {
    messages: filtered,
    next_cursor: filtered.length === limit ? filtered[filtered.length - 1].created_at : null,
  });
});


export const sendMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const {
    conversation_id,
    content,
    message_type = "text",
    file_url,
    file_type,
    reply_to_id,
  } = req.body;

  if (!conversation_id)
    return sendResponse(res, 400, "conversation_id is required");
  if (!content && !file_url)
    return sendResponse(res, 400, "content or file_url is required");

  const VALID_TYPES = ["text", "image", "video", "audio", "document", "sticker", "gif", "location", "contact"];
  if (!VALID_TYPES.includes(message_type))
    return sendResponse(res, 400, "Invalid message_type");

  // Verify membership
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("user_id", id)
    .is("left_at", null)
    .is("removed_at", null)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this conversation");

  // Insert message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: id,
      content: content || null,
      message_type,
      file_url: file_url || null,
      file_type: file_type || null,
      reply_to_id: reply_to_id || null,
    })
    .select(
      `id, conversation_id, sender_id, message_type, content,
      file_url, file_type, edited_at, is_pinned, created_at,
      reply_to:reply_to_id (
        id, content, message_type, sender_id
      ),
      sender:sender_id (
        id, username, display_name, avatar_url
      )`
    )
    .single();

  if (msgError) return sendResponse(res, 500, "Internal Server error", null);

  // Update conversation last_message
  const { error: convError } = await supabase
    .from("conversations")
    .update({
      last_message_id: message.id,
      last_message_at: message.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversation_id);

  if (convError) return sendResponse(res, 500, "Internal Server error", null);

  return sendResponse(res, 201, "Message sent", message);
});

// =========================================
// EDIT MESSAGE
// =========================================
export const editMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: messageId } = req.params;
  const { content } = req.body;

  if (!content) return sendResponse(res, 400, "content is required");

  // Fetch message to verify ownership + type + time window
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, sender_id, message_type, created_at")
    .eq("id", messageId)
    .single();

  if (fetchError || !message)
    return sendResponse(res, 404, "Message not found", null);
  if (message.sender_id !== id)
    return sendResponse(res, 403, "You can only edit your own messages");
  if (message.message_type !== "text")
    return sendResponse(res, 400, "Only text messages can be edited");

  const ageMs = Date.now() - new Date(message.created_at).getTime();
  if (ageMs > EDIT_WINDOW_MS)
    return sendResponse(res, 403, "Edit window of 15 minutes has passed");

  const { data, error } = await supabase
    .from("messages")
    .update({ content, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("id, content, edited_at")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Message edited", data);
});

// =========================================
// DELETE MESSAGE
// =========================================
export const deleteMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: messageId } = req.params;
  const { mode } = req.body; // "for_me" | "for_everyone"

  if (!mode || !["for_me", "for_everyone"].includes(mode))
    return sendResponse(res, 400, 'mode must be "for_me" or "for_everyone"');

  // Fetch message
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, sender_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message)
    return sendResponse(res, 404, "Message not found", null);

  if (mode === "for_everyone") {
    if (message.sender_id !== id)
      return sendResponse(res, 403, "You can only delete your own messages for everyone");

    const { error } = await supabase
      .from("messages")
      .update({ deleted_for_everyone_at: new Date().toISOString() })
      .eq("id", messageId);

    if (error) return sendResponse(res, 500, "Internal Server error", null);
    return sendResponse(res, 200, "Message deleted for everyone", null);
  }

  // for_me
  const { error } = await supabase
    .from("messages")
    .update({ deleted_for_me_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("sender_id", id); // soft delete only own "for_me" record

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Message deleted for you", null);
});


export const pinMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: messageId } = req.params;

  // Verify message exists + get conversation_id
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message)
    return sendResponse(res, 404, "Message not found", null);

  // Verify membership
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", id)
    .is("left_at", null)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this conversation");

  const { data, error } = await supabase
    .from("messages")
    .update({ is_pinned: true })
    .eq("id", messageId)
    .select("id, is_pinned")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Message pinned", data);
});


export const unpinMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: messageId } = req.params;

  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("id, conversation_id")
    .eq("id", messageId)
    .single();

  if (fetchError || !message)
    return sendResponse(res, 404, "Message not found", null);

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", message.conversation_id)
    .eq("user_id", id)
    .is("left_at", null)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this conversation");

  const { data, error } = await supabase
    .from("messages")
    .update({ is_pinned: false })
    .eq("id", messageId)
    .select("id, is_pinned")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Message unpinned", data);
});



export const forwardMessage = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: messageId } = req.params;
  const { conversation_ids } = req.body;

  if (!conversation_ids || !Array.isArray(conversation_ids) || conversation_ids.length === 0)
    return sendResponse(res, 400, "conversation_ids array is required");

  // Fetch original message
  const { data: original, error: fetchError } = await supabase
    .from("messages")
    .select("content, message_type, file_url, file_type")
    .eq("id", messageId)
    .is("deleted_for_everyone_at", null)
    .single();

  if (fetchError || !original)
    return sendResponse(res, 404, "Message not found", null);

  // Verify sender is member of all target conversations
  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", id)
    .in("conversation_id", conversation_ids)
    .is("left_at", null)
    .is("removed_at", null);

  const validIds = memberships?.map((m) => m.conversation_id) || [];
  const invalidIds = conversation_ids.filter((cid) => !validIds.includes(cid));

  if (invalidIds.length > 0)
    return sendResponse(res, 403, "Not a member of some target conversations");

  // Insert forwarded messages into all target conversations
  const inserts = conversation_ids.map((cid) => ({
    conversation_id: cid,
    sender_id: id,
    content: original.content,
    message_type: original.message_type,
    file_url: original.file_url,
    file_type: original.file_type,
    forwarded_from_id: messageId,
    is_forwarded: true,
  }));

  const { data: forwarded, error: insertError } = await supabase
    .from("messages")
    .insert(inserts)
    .select("id, conversation_id, content, message_type, is_forwarded, created_at");

  if (insertError) return sendResponse(res, 500, "Internal Server error", null);

  // Update last_message for all target conversations
  await Promise.all(
    forwarded.map((msg) =>
      supabase
        .from("conversations")
        .update({
          last_message_id: msg.id,
          last_message_at: msg.created_at,
          updated_at: msg.created_at,
        })
        .eq("id", msg.conversation_id)
    )
  );

  return sendResponse(res, 201, "Message forwarded", forwarded);
});