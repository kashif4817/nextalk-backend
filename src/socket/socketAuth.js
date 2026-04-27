import supabase from "../config/supabase.js";

export const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Unauthorized"));
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error) {
    return next(new Error("Internal server error"));
  }

  socket.data.userId = user.id;
  next();
};
