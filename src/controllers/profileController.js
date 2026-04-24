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

  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (data.length === 0) return sendResponse(res, 404, "No user found", null);
  return sendResponse(res, 200, "User found", data[0]);
});



// TODO: Phase 2 - apply canSee() privacy filter before returning
// Currently returning all fields to all users (bypass for v1.0 dev)
export const getUserProfile = asyncHandler(async (req, res) => {
  const {id} = req.params;
  console.log("id :>> ", id);

  if (!id) return sendResponse(res, 400, "No userId provided");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id);
console.log(error);
  if (error) return sendResponse(res, 500, "Internal Server error", null);
  if (data.length === 0) return sendResponse(res, 404, "No user found", null);
  return sendResponse(res, 200, "User found", data[0]);
});
