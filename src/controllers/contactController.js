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
  console.log("add contact hit");

  const userId = req.user.id;
  const { contact_id, nickname } = req.body;
  console.log(req.body);

  if (!contact_id) {
    return sendResponse(res, 400, "contact_id is required");
  }

  if (contact_id === userId) {
    return sendResponse(res, 400, "You cannot add yourself as a contact");
  }

  // Check if target user exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", contact_id)
    .maybeSingle();

    
  if (profileError) {
    console.log(profileError);
    return sendResponse(res, 500, "Internal Server error", null);
  }
console.log(profile);
  if (!profile) {
    return sendResponse(res, 404, "User not found", null);
  }

  // Check block in both directions
  const { data: block, error: blockError } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${contact_id}),and(blocker_id.eq.${contact_id},blocked_id.eq.${userId})`
    )
    .maybeSingle();

  if (blockError) {
    console.log(blockError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (block) {
    return sendResponse(res, 403, "Cannot add this user");
  }

  // Insert contact
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      contact_id,
      nickname: nickname || null,
    })
    .select(`
      id,
      nickname,
      created_at,
      contact:profiles!contacts_contact_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        is_online,
        last_seen
      )
    `)
    .single();

  if (error) {
    console.log(error);

    if (error.code === "23505") {
      return sendResponse(res, 409, "Contact already added");
    }

    return sendResponse(res, 500, "Internal Server error", null);
  }

  return sendResponse(res, 201, "Contact added", data);
});

export const updateContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { contact_id } = req.params;
  const { nickname } = req.body;

  if (nickname === undefined) {
    return sendResponse(res, 400, "nickname is required");
  }

  const { data, error } = await supabase
    .from("contacts")
    .update({ nickname })
    .eq("user_id", userId)
    .eq("contact_id", contact_id)
    .select("contact_id, nickname")
    .maybeSingle();

  if (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!data) {
    return sendResponse(res, 404, "Contact not found", null);
  }

  return sendResponse(res, 200, "Contact updated", data);
});



export const removeContact = asyncHandler(async (req, res) => {
  console.log("removeContact hit");
  const userId = req.user.id;
  const { contact_id } = req.params;
console.log(userId,contact_id);
  const { data, error } = await supabase
    .from("contacts")
    .delete()
    .eq("user_id", userId)
    .eq("contact_id", contact_id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!data) {
    return sendResponse(res, 404, "Contact not found", null);
  }

  return sendResponse(res, 200, "Contact removed", null);
});