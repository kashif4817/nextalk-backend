// import asyncHandler from "../utils/asyncHandler.js";
// import { sendResponse } from "../utils/sendResponse.js";
// import supabase from "../config/supabase.js";

// export const searchUsers = asyncHandler(async (req, res) => {
//   const { search } = req.query;
//   console.log("search", search);

//   if (!search) return sendResponse(res, 400, "No query provided");

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("*")
//     .ilike("username", `%${search}%`);
//   console.log(data, error);

//   if (error) return sendResponse(res, 500, "Internal Server error", null);
//   if (data.length === 0) return sendResponse(res, 404, "No user found");
//   return sendResponse(res, 200, "User found", data);
// });


// export const toggleOnlineStatus = asyncHandler(async (req, res) => {
//   const { toggleStatus } = req.body;
//   console.log(toggleStatus);

//   if (!toggleStatus) return sendResponse(res, 400, "No toggleStatus provided");

//   const { data, error } = await supabase
//     .from("profiles")
//     .select("is_online")
//     .eq("id", id);
//   console.log(error);
//   if (error) return sendResponse(res, 500, "Internal Server error", null);
//   if (data.length === 0) return sendResponse(res, 404, "User not found", null);
//   return sendResponse(res, 200, "User found", data);
// });
