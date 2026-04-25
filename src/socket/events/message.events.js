export const messageEvents = (io, socket) => {
  socket.on('message:send', async (data) => {
    // 1. get sender_id from socket.data.userId
  const userId = socket.data.userId;
      // 2. insert message to DB

    // 3. update conversation last_message_id
    
    // 4. emit message:new to conv:{conversation_id}
  })
}