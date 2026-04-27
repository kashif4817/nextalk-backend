import supabase from "../config/supabase.js";
import { messageEvents } from "./events/message.events.js";
import { typingEvents } from "./events/typing.events.js";
import { presenceEvents } from "./events/presence.events.js";

export const socketHandler = (io) => async (socket) => {
  const userId = socket.data.userId;

  socket.join(`user:${socket.data.userId}`);

  const { data: conversations } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId)
    .is("left_at", null)
    .is("removed_at", null);
  conversations.forEach((c) => {
    socket.join(`conv:${c.conversation_id}`); // ←
  });

  // after joining rooms, mark user online
  await supabase.from("profiles").update({ is_online: true }).eq("id", userId);
  messageEvents(io, socket);
  typingEvents(io, socket);
  presenceEvents(io, socket);

  socket.on("disconnect", async () => {
    await supabase
      .from("profiles")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("id", userId);
  });
};
