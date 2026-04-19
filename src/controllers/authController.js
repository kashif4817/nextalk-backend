// authController.js

import supabase from "../config/supabase.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return sendResponse(res, 400, "Email and password required");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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

export const logout = asyncHandler(async (req, res) => {

  const { data, error } = await supabase.auth.signOut();

  if (error) return sendResponse(res, 400, error.message, null);
  return sendResponse(res, 201, "Logout successful");
});

export const refreshToken = asyncHandler(async (req, res) => {

  const { data, error } = await supabase.auth.refreshToken();

  if (error) return sendResponse(res, 400, error.message,);
  return sendResponse(res, 200, "New refreshToken assigned",{refreshToken: data.session?.refreshToken });
});



export const forgotPassword = asyncHandler(async (req, res) => {

  const { data, error } = await supabase.auth.refreshToken();

  if (error) return sendResponse(res, 400, error.message,);
  return sendResponse(res, 200, "New refreshToken assigned",{refreshToken: data.session?.refreshToken });
});


