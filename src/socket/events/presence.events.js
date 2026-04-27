import supabase from "../../config/supabase.js";

export const presenceEvents = (io, socket) => {
  const broadcastPresence = async (status) => {
    const userId = socket.data.userId
    
    // get my contacts
    const { data: contacts } = await supabase
      .from("contacts")
      .select("contact_id")
      .eq("user_id", userId)

    // notify each contact
    contacts?.forEach(c => {
      io.to(`user:${c.contact_id}`).emit("presence:update", {
        userId,
        is_online: status,
        last_seen: status ? null : new Date().toISOString()
      })
    })
  }

  socket.on("presence:ping", () => broadcastPresence(true))
  socket.on("disconnect", () => broadcastPresence(false))
}