import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

export const getAllConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("conversation_members")
    .select(`
      id,
      role,
      last_read_at,
      is_archived,
      is_pinned,
      muted_until,
      conversation:conversation_id (
        id,
        is_group,
        group_name,
        group_avatar,
        group_description,
        last_message_at,
        created_at,
        deleted_at,
        last_message:last_message_id (
          id,
          content,
          message_type,
          sender_id,
          created_at
        ),
        members:conversation_members (
          user_id,
          left_at,
          removed_at,
          profile:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_online,
            last_seen
          )
        )
      )
    `)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .order("last_read_at", { ascending: false });

  if (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  const active = (data || []).filter((r) => !r.conversation?.deleted_at);

  const enriched = await Promise.all(
    active.map(async (row) => {
      const conversationId = row.conversation?.id;
      const lastReadAt = row.last_read_at;

      if (!conversationId) return { ...row, unread_count: 0 };

      let query = supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("deleted_for_everyone_at", null);

      if (lastReadAt) {
        query = query.gt("created_at", lastReadAt);
      }

      const { count, error: countError } = await query;

      if (countError) {
        console.log(countError);
      }

      return {
        ...row,
        unread_count: count || 0,
        conversation: {
          ...row.conversation,
          members: (row.conversation?.members || []).filter(
            (m) => !m.left_at && !m.removed_at
          ),
        },
      };
    })
  );

  return sendResponse(res, 200, "Conversations fetched", enriched);
});


export const getConversation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: conversationId } = req.params;

  const { data: membership, error: memberError } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (memberError) {
    console.log(memberError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!membership) {
    return sendResponse(res, 403, "Not a member of this conversation");
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      is_group,
      group_name,
      group_avatar,
      group_description,
      created_by,
      last_message_at,
      created_at,
      last_message:last_message_id (
        id,
        content,
        message_type,
        sender_id,
        created_at
      ),
      members:conversation_members (
        id,
        role,
        last_read_at,
        is_archived,
        is_pinned,
        created_at,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_online,
          last_seen
        )
      )
    `)
    .eq("id", conversationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (!data) return sendResponse(res, 404, "Conversation not found", null);

  return sendResponse(res, 200, "Conversation fetched", data);
});



export const createOrGetDM = asyncHandler(async (req, res) => {
  console.log("createOrGetDM hit");
  const userId = req.user.id;
  const { user_id: targetId } = req.body;

  console.log(userId,targetId);

  if (!targetId) return sendResponse(res, 400, "user_id is required");
  if (targetId === userId) return sendResponse(res, 400, "Invalid request");


  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();

  if (profileError) {
    console.log(profileError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (!profile) return sendResponse(res, 404, "User not found", null);

  const { data: block, error: blockError } = await supabase
    .from("blocked_users")
    .select("id")
    .or(
      `and(blocker_id.eq.${userId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${userId})`
    )
    .maybeSingle();

  if (blockError) {
    console.log(blockError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  if (block) {
    return sendResponse(res, 403, "Blocked user");
  }

  const { data: myConvs } = await supabase
    .from("conversation_members")
    .select(`
      conversation_id,
      conversation:conversation_id (
        id,
        is_group,
        deleted_at
      )
    `)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null);

  const { data: theirConvs } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", targetId)
    .is("left_at", null)
    .is("removed_at", null);

  const myIds = (myConvs || [])
    .filter((c) => c.conversation && c.conversation.is_group === false && !c.conversation.deleted_at)
    .map((c) => c.conversation_id);

  const theirIds = (theirConvs || []).map((c) => c.conversation_id);

  const shared = myIds.filter((id) => theirIds.includes(id));

  if (shared.length) {
    const { data: existing } = await supabase
      .from("conversations")
      .select(`
        id,
        is_group,
        last_message_at,
        created_at,
        members:conversation_members (
          id,
          role,
          profile:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_online,
            last_seen
          )
        )
      `)
      .eq("id", shared[0])
      .eq("is_group", false)
      .maybeSingle();

    return sendResponse(res, 200, "DM exists", existing);
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({ is_group: false, created_by: userId })
    .select("id")
    .single();

  if (convError) {
    console.log(convError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  const { error: membersError } = await supabase
    .from("conversation_members")
    .insert([
      { conversation_id: conversation.id, user_id: userId, role: "member" },
      { conversation_id: conversation.id, user_id: targetId, role: "member" }
    ]);

  if (membersError) {
    console.log(membersError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  const { data: newDM } = await supabase
    .from("conversations")
    .select(`
      id,
      is_group,
      created_at,
      members:conversation_members (
        id,
        role,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_online,
          last_seen
        )
      )
    `)
    .eq("id", conversation.id)
    .maybeSingle();

  return sendResponse(res, 201, "DM created", newDM);
});



export const createGroup = asyncHandler(async (req, res) => {
  console.log("createGroup hit");

  const userId = req.user.id;
  const { group_name, group_avatar, group_description, member_ids } = req.body;

  if (!group_name) return sendResponse(res, 400, "group_name required");
  if (!Array.isArray(member_ids) || !member_ids.length)
    return sendResponse(res, 400, "member_ids required");

  const uniqueMembers = [...new Set(member_ids.filter((id) => id !== userId))];

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({
      is_group: true,
      group_name,
      group_avatar,
      group_description,
      created_by: userId
    })
    .select("id")
    .single();

  if (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  const members = [
    { conversation_id: conversation.id, user_id: userId, role: "admin" },
    ...uniqueMembers.map((id) => ({
      conversation_id: conversation.id,
      user_id: id,
      role: "member"
    }))
  ];

  const { error: memberError } = await supabase
    .from("conversation_members")
    .insert(members);

  if (memberError) {
    console.log(memberError);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  const { data: group } = await supabase
    .from("conversations")
    .select(`
      id,
      is_group,
      group_name,
      group_avatar,
      group_description,
      created_by,
      created_at,
      members:conversation_members (
        id,
        role,
        profile:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_online
        )
      )
    `)
    .eq("id", conversation.id)
    .maybeSingle();

  return sendResponse(res, 201, "Group created", group);
});

export const updateGroupInfo = asyncHandler(async (req, res) => {
  console.log("updatedGroupInfo hit");
  const userId = req.user.id;
  const { id } = req.params;
  const { group_name, group_avatar, group_description } = req.body;

  const { data: member } = await supabase
    .from("conversation_members")
    .select("role")
    .eq("conversation_id", id)
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null)
    .maybeSingle();

  if (!member) return sendResponse(res, 403, "Not allowed");
  if (!["admin", "owner"].includes(member.role))
    return sendResponse(res, 403, "Only admin/owner can update");

  const updates = { updated_at: new Date().toISOString() };
  if (group_name !== undefined) updates.group_name = group_name;
  if (group_avatar !== undefined) updates.group_avatar = group_avatar;
  if (group_description !== undefined) updates.group_description = group_description;

  if (Object.keys(updates).length === 1) {
    return sendResponse(res, 400, "No fields to update");
  }

  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .eq("is_group", true)
    .is("deleted_at", null)
    .select("id, group_name, group_avatar, group_description, updated_at")
    .maybeSingle();

  if (error) {
    console.log(error);
    return sendResponse(res, 500, "Internal Server error", null);
  }

  return sendResponse(res, 200, "Updated", data);
});