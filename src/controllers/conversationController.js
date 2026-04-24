import supabase from "../config/supabase.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createConversation = asyncHandler(async (req, res) => {
  console.log("create Conversation hit");
  const user1Id = req.user.id;
  const { user2Id } = req.body;

  console.log("User1:", user1Id, "User2:", user2Id);

  // Step 1: Get all conversations of user1
  const { data: user1Conversations, error: user1Error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user1Id);

  if (user1Error) {
    return sendResponse(res, 500, "Internal Server Error");
  }

  const conversationIds = user1Conversations.map((c) => c.conversation_id);

  // Step 2: Check if user2 exists in any of those conversations
  const { data: existingConversation, error: user2Error } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user2Id)
    .in("conversation_id", conversationIds);

  if (user2Error) {
    return sendResponse(res, 500, "Internal Server Error");
  }

  // Step 3: If conversation already exists
  if (existingConversation.length > 0) {
    return sendResponse(
      res,
      200,
      "Conversation already exists",
      existingConversation,
    );
  }

  // Step 4: Create new conversation
  const { data: newConversation, error: createError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (createError) {
    return sendResponse(res, 500, "Failed to create conversation");
  }

  const conversationId = newConversation.id;

  // Step 5: Add both users
  const { error: member1Error } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: user1Id });

  if (member1Error) {
    return sendResponse(res, 500, "Failed to add user1");
  }

  const { error: member2Error } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: user2Id });

  if (member2Error) {
    return sendResponse(res, 500, "Failed to add user2");
  }

  return sendResponse(res, 201, "New conversation created", newConversation);
});

export const getSingleConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  console.log(id, currentUserId);
  // ✅ Get conversation (single object)
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, created_at") // only what you need
    .eq("id", id)
    .single();

  if (convError || !conversation) {
    return sendResponse(res, 404, "Conversation not found");
  }

  // ✅ Get OTHER participants only
  const { data: participants, error: partError } = await supabase
    .from("conversation_members")
    .select("user_id, profiles(id, name, avatar)")
    .eq("conversation_id", id)
    .neq("user_id", currentUserId);

  if (partError) {
    return sendResponse(res, 500, "Failed to fetch participants");
  }

  return sendResponse(res, 200, "Data found", {
    conversation,
    participants,
  });
});

export const getAllConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  console.log( currentUserId);

  //step  1, getting all conversation on current user.
  const { data: participants, error: partError } = await supabase
    .from("conversation_members")
.select("conversation_id")
    .eq("user_id", currentUserId);



  console.log("participants :>> ", participants);
  if (partError) {
    return sendResponse(res, 500, "Failed to fetch participants");
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("last_message")
    .in(
      "id",
      participants.map(d=>d.conversation_id)
    );

  (console.log("data"), data);

  const { data: message, error: messError } = await supabase
    .from("messages")
    .select("content")
    .in(
      "conversation_id",
         participants.map(d=>d.conversation_id),
    )
    .eq("seen", false)
    .neq("sender_id", currentUserId);

  console.log("data",data)

  console.log("participants :>> ", participants);
  if (partError) {
    return sendResponse(res, 500, "Failed to fetch participants");
  }
});
