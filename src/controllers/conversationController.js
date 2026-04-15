// authController.js

import supabase from "../config/supabase.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createConversation = asyncHandler(async (req, res) => {
    const {id} = req.user.id; // from middleware
  const {id_2} = req.body;

  if (!id || !id_2) return sendResponse(res, 400, "Id required");

  const { data, error } = await supabase
  .from('conversation_members')

  if (error) return sendResponse(res, 400, error.message, null);
  return sendResponse(res, 200, "Login successful", { access_token: data.session.access_token });
});

export const signup = asyncHandler(async (req, res) => {
    console.log("signup api hit")
  const { email, password } = req.body;

  if (!email || !password) return sendResponse(res, 400, "Email and password required");

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) return sendResponse(res, 400, error.message, null);
  return sendResponse(res, 201, "Signup successful", { access_token: data.session?.access_token });
});