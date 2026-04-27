export const typingEvents = (io, socket) => {
  socket.on("typing:start", (data) => {
    // broadcast to conversation room EXCEPT sender
    socket.to(`conv:${data.conversation_id}`).emit("typing:start", {
      userId: socket.data.userId,
      conversation_id: data.conversation_id
    })
  })

  socket.on("typing:stop", (data) => {
    socket.to(`conv:${data.conversation_id}`).emit("typing:stop", {
      userId: socket.data.userId,
      conversation_id: data.conversation_id
    })
  })
}