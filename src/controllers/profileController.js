import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import supabase from "../config/supabase.js";

export const getMe = asyncHandler(async (req, res) => {
  const id = req.user.id;
  console.log("id :>> ", id);

  if (!id) return sendResponse(res, 400, "No userId provided in token");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id);

  console.log("data, error :>> ", data, error);
  if (error) return sendResponse(res, 500, "Internal Server error", null);
  return sendResponse(res, 200, "User found", data[0]);
});
