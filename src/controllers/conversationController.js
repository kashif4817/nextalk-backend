import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";


export const getAllConversations = asyncHandler(async (req, res) => {
  const id = req.user.id;

  // Get all conversations the user is a member of
  const { data, error } = await supabase
    .from("conversation_members")
    .select(
      `id, role, last_read_at, is_archived, is_pinned, muted_until,
      conversation:conversation_id (
        id, is_group, group_name, group_avatar, group_description,
        last_message_at, created_at,
        last_message:last_message_id (
          id, content, message_type, sender_id, created_at
        ),
        members:conversation_members (
          user_id,
          profile:user_id (
            id, username, display_name, avatar_url, is_online, last_seen
          )
        )
      )`
    )
    .eq("user_id", id)
    .is("deleted_at", null)
    .is("left_at", null)
    .is("removed_at", null)
    .order("created_at", { ascending: false, foreignTable: "conversation" });

  if (error) return sendResponse(res, 500, "Internal Server error", null);

  // Compute unread count per conversation
  const enriched = await Promise.all(
    data.map(async (row) => {
      const lastReadAt = row.last_read_at;
      const conversationId = row.conversation?.id;

      let unread_count = 0;

      if (conversationId) {
        const query = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", id)
          .is("deleted_for_everyone_at", null);

        if (lastReadAt) query.gt("created_at", lastReadAt);

        const { count } = await query;
        unread_count = count || 0;
      }

      return { ...row, unread_count };
    })
  );

  return sendResponse(res, 200, "Conversations fetched", enriched);
});



export const getConversation = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: conversationId } = req.params;

  // Verify membership
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", id)
    .is("left_at", null)
    .is("removed_at", null)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this conversation");

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, is_group, group_name, group_avatar, group_description,
      created_by, last_message_at, created_at,
      last_message:last_message_id (
        id, content, message_type, sender_id, created_at
      ),
      members:conversation_members (
        id, role, last_read_at, is_archived, is_pinned, joined_at:created_at,
        profile:user_id (
          id, username, display_name, avatar_url, is_online, last_seen
        )
      )`
    )
    .eq("id", conversationId)
    .is("deleted_at", null)
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Conversation not found", null);
  return sendResponse(res, 200, "Conversation fetched", data);
});



export const createOrGetDM = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { user_id: targetId } = req.body;

  if (!targetId) return sendResponse(res, 400, "user_id is required");
  if (targetId === id)
    return sendResponse(res, 400, "You cannot DM yourself");

  // Check target user exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .single();

  if (profileError || !profile)
    return sendResponse(res, 404, "User not found", null);

  // Check block (either direction)
  const { data: block } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${id},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${id})`
    )
    .maybeSingle();

  if (block) return sendResponse(res, 403, "Cannot start conversation with this user");

  // Find existing DM between both users
  const { data: myDMs } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", id);

  const { data: theirDMs } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", targetId);

  const myIds = myDMs?.map((r) => r.conversation_id) || [];
  const theirIds = theirDMs?.map((r) => r.conversation_id) || [];
  const sharedIds = myIds.filter((cid) => theirIds.includes(cid));

  if (sharedIds.length > 0) {
    // Return existing DM
    const { data: existing, error: existingError } = await supabase
      .from("conversations")
      .select(
        `id, is_group, last_message_at, created_at,
        last_message:last_message_id (
          id, content, message_type, sender_id, created_at
        ),
        members:conversation_members (
          id, role,
          profile:user_id (
            id, username, display_name, avatar_url, is_online
          )
        )`
      )
      .eq("id", sharedIds[0])
      .eq("is_group", false)
      .single();

    if (existingError)
      return sendResponse(res, 500, "Internal Server error", null);
    return sendResponse(res, 200, "DM already exists", existing);
  }

  // Create new DM conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: id })
    .select("id")
    .single();

  if (convError) return sendResponse(res, 500, "Internal Server error", null);

  // Add both members
  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert([
      { conversation_id: conversation.id, user_id: id, role: "member" },
      { conversation_id: conversation.id, user_id: targetId, role: "member" },
    ]);

  if (membersError)
    return sendResponse(res, 500, "Internal Server error", null);

  const { data: newDM, error: newDMError } = await supabase
    .from("conversations")
    .select(
      `id, is_group, last_message_at, created_at,
      members:conversation_members (
        id, role,
        profile:user_id (
          id, username, display_name, avatar_url, is_online
        )
      )`
    )
    .eq("id", conversation.id)
    .single();

  if (newDMError) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 201, "DM created", newDM);
});


export const createGroup = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { group_name, group_avatar, group_description, member_ids } = req.body;

  if (!group_name) return sendResponse(res, 400, "group_name is required");
  if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0)
    return sendResponse(res, 400, "member_ids array is required");
  if (member_ids.includes(id))
    return sendResponse(res, 400, "Do not include yourself in member_ids");

  // Create group conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      is_group: true,
      group_name,
      group_avatar: group_avatar || null,
      group_description: group_description || null,
      created_by: id,
    })
    .select("id")
    .single();

  if (convError) return sendResponse(res, 500, "Internal Server error", null);

  // Creator is owner, rest are members
  const membersToInsert = [
    { conversation_id: conversation.id, user_id: id, role: "owner" },
    ...member_ids.map((uid) => ({
      conversation_id: conversation.id,
      user_id: uid,
      role: "member",
    })),
  ];

  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert(membersToInsert);

  if (membersError)
    return sendResponse(res, 500, "Internal Server error", null);

  const { data: group, error: groupError } = await supabase
    .from("conversations")
    .select(
      `id, is_group, group_name, group_avatar, group_description,
      created_by, created_at,
      members:conversation_members (
        id, role,
        profile:user_id (
          id, username, display_name, avatar_url
        )
      )`
    )
    .eq("id", conversation.id)
    .single();

  if (groupError) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 201, "Group created", group);
});



export const updateGroupInfo = asyncHandler(async (req, res) => {
  const id = req.user.id;
  const { id: conversationId } = req.params;
  const { group_name, group_avatar, group_description } = req.body;

  if (!group_name && !group_avatar && !group_description)
    return sendResponse(res, 400, "No fields provided to update");

  // Check admin/owner role
  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", conversationId)
    .eq("user_id", id)
    .single();

  if (memberError || !membership)
    return sendResponse(res, 403, "You are not a member of this group");
  if (!["admin", "owner"].includes(membership.role))
    return sendResponse(res, 403, "Only admins and owners can update group info");

  const updates = {};
  if (group_name !== undefined) updates.group_name = group_name;
  if (group_avatar !== undefined) updates.group_avatar = group_avatar;
  if (group_description !== undefined) updates.group_description = group_description;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", conversationId)
    .eq("is_group", true)
    .select("id, group_name, group_avatar, group_description, updated_at")
    .single();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Group not found", null);
  return sendResponse(res, 200, "Group info updated", data);
});