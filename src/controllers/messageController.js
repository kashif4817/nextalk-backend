import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { convId } = req.params;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conv_id", convId)
    .is("deleted_at", null)
    .lt("id", cursor) // only if cursor exists
    .order("created_at", { ascending: false })
    .limit(limit || 20);

  if (error) {
    sendResponse(res, "Internal server error");
  }
  sendResponse(res, 200, "data fetched successfully", data);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const sender_id = req.user.id;
  const { content, file_url, file_type } = req.body;
  const { convId } = req.params;

  const { data, error } = await supabase.from("messages").insert({
    content: content,
    file_url: file_url || null,
    file_type: file_type || null,
    conversation_id: convId,
    sender_id: sender_id,
  });

  if (error) return sendResponse(res, 500, "faild to insert message");

  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .update({
      last_message: content || "",
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", convId);

  if (convError) return sendResponse(res, 500, "failed to update conersations");
  return sendResponse(res, 201, "message sent");
});

export const editMessage = asyncHandler(async (req, res) => {
  const sender_id = req.user.id;
  const { editedContent } = req.body;
  const { messageId } = req.params;

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (messageError) return sendResponse(res, 401, "message not found");

  if (message.sender_id !== sender_id) {
    return sendResponse(
      res,
      401,
      "Unable to edit message as this message not belongs to you",
    );
  }

  const now = new Date();
  const createdAt = new Date(message.created_at);
  const diffInMinutes = (now - createdAt) / 1000 / 60;

  if (diffInMinutes > 15) {
    return sendResponse(res, 400, "Unable to edit message after 15 minutes");
  }

  const { data: upMessage, error: upError } = await supabase
    .from("messages")
    .update({ content: editedContent, is_edited: true })
    .eq("id", messageId);

  if (upError) return sendResponse(res, 500, "unable to update message");
  return sendResponse(res, 201, "message Updated");
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const sender_id = req.user.id;
  const { messageId } = req.params;
  const { deleteType } = req.body; // me or everyone

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (messageError) return sendResponse(res, 401, "message not found");

  if (message.sender_id !== sender_id) {
    return sendResponse(
      res,
      401,
      "Unable to edit message as this message not belongs to you",
    );
  }
  if (deleteType === "me") {
    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_for_me_at: new Date().toISOString() })
      .eq(id, messageId);
    if (error) return sendResponse(res, 500, "faild to delete message");
  } else {
    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_for_everyone_at: new Date().toISOString() })
      .eq(id, messageId);
    if (error) return sendResponse(res, 500, "faild to delete message");
  }
  return sendResponse(res, 201, "message deleted");
});



export const markAsSeen = asyncHandler(async (req, res) => {

  const sender_id = req.user.id;
  const { convId } = req.params;
  const { deleteType } = req.body; 

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();
  if (messageError) return sendResponse(res, 401, "message not found");

  if (message.sender_id !== sender_id) {
    return sendResponse(
      res,
      401,
      "Unable to edit message as this message not belongs to you",
    );
  }
  if (deleteType === "me") {
    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_for_me_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) return sendResponse(res, 500, "faild to delete message");
  } else {
    const { data, error } = await supabase
      .from("messages")
      .update({ deleted_for_everyone_at: new Date().toISOString() })
      .eq("id", messageId);
    if (error) return sendResponse(res, 500, "faild to delete message");
  }
  return sendResponse(res, 201, "message deleted");
});

