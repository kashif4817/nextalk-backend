import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";


export const getContacts = asyncHandler(async (req, res) => {
  const id = req.user.id;

  const { data, error } = await supabase
    .from("contacts")
    .select(
      `id, nickname, created_at,
      contact:contact_id (
        id, username, display_name, avatar_url, is_online, last_seen
      )`
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "Contacts fetched", data);
});

export const addContact = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { contact_id, nickname } = req.body;

  if (!contact_id) return sendResponse(res, 400, "contact_id is required");
  if (contact_id === id)
    return sendResponse(res, 400, "You cannot add yourself as a contact");

  // Check if target user exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", contact_id)
    .single();

  if (profileError || !profile)
    return sendResponse(res, 404, "User not found", null);

  // Check if blocked (either direction)
  const { data: block } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `blocker_id.eq.${id},blocked_id.eq.${id}`
    )
    .or(
      `blocker_id.eq.${contact_id},blocked_id.eq.${contact_id}`
    )
    .maybeSingle();

  if (block) return sendResponse(res, 403, "Cannot add this user");

  const { data, error } = await supabase
    .from("contacts")
    .insert({ user_id: id, contact_id, nickname: nickname || null })
    .select(
      `id, nickname, created_at,
      contact:contact_id (
        id, username, display_name, avatar_url
      )`
    )
    .single();

  if (error) {
    if (error.code === "23505")
      return sendResponse(res, 409, "Contact already added");
    return sendResponse(res, 500, "Internal Server error", null);
  }

  return sendResponse(res, 201, "Contact added", data);
});

export const updateContact = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: contactRowId } = req.params;
  const { nickname } = req.body;

  if (nickname === undefined)
    return sendResponse(res, 400, "nickname is required");

  const { data, error } = await supabase
    .from("contacts")
    .update({ nickname: nickname || null })
    .eq("id", contactRowId)
    .eq("user_id", id) // ensure ownership
    .select("id, nickname")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Contact not found", null);
  return sendResponse(res, 200, "Contact updated", data);
});

export const removeContact = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: contactRowId } = req.params;

  const { data, error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactRowId)
    .eq("user_id", id) // ensure ownership
    .select("id")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Contact not found", null);
  return sendResponse(res, 200, "Contact removed", null);
});
