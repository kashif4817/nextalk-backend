import { createMessage } from "../../services/message.service.js";

export const messageEvents = (io, socket) => {
  socket.on("message:send", async (data) => {
    const sender_id = socket.data.userId;
    const {
      conversation_id,
      content,
      message_type,
      file_url,
      file_type,
      reply_to_id,
    } = data;

    const message = await createMessage({
      conversation_id,
      sender_id,
      content,
      message_type,
      file_url,
      file_type,
      reply_to_id,
    });

    if (!message) return; // silent fail on socket

    // emit to conversation room
    io.to(`conv:${conversation_id}`).emit("message:new", message);
  });
};
