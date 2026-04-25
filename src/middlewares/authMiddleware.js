import supabase from "../config/supabase.js";
import { sendResponse } from "../utils/sendResponse.js";

export const authMiddleware = async (req, res, next) => {
  console.log("middleware hit");
  const token = req.headers.authorization.split(" ")[1];
  if (!token) return sendResponse(res, 401, "user not authorized");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error) return sendResponse(res, 401, "Invalid or expired token");

  req.user = {
    id: user.id,
    email: user.email,
  };

  next();
};
