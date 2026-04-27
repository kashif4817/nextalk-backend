// services/message.service.js
import supabase from "../config/supabase.js";
export const createMessage = async ({
  conversation_id,
  sender_id,
  content,
  message_type,
  reply_to_id,
  file_url, // ← add
  file_type, // ← add
}) => {
  if (!conversation_id) return false;
  if (!content && !file_url) return false;

  const VALID_TYPES = [
    "text",
    "image",
    "video",
    "audio",
    "document",
    "sticker",
    "gif",
    "location",
    "contact",
  ];
  if (!VALID_TYPES.includes(message_type)) return false;
  // Verify membership
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversation_id)
    .eq("user_id", sender_id)
    .is("left_at", null)
    .is("removed_at", null)
    .single();

  if (memberError || !membership) return false;
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id,
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
      )`,
    )
    .single();

  if (msgError) return false;

  // Update conversation's last message pointer
  const { error: convError } = await supabase
    .from("conversations")
    .update({
      last_message_id: message.id,
      last_message_at: message.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversation_id);

  if (convError) return false;
  return message;
};
