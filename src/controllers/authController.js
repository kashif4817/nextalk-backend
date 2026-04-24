// authController.js

import supabase from "../config/supabase.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return sendResponse(res, 400, "Email and password required");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return sendResponse(res, 400, error.message, null);
  return sendResponse(res, 200, "Login successful", {
    access_token: data.session.access_token,
    id: data.user.id,
  });
});

export const signup = asyncHandler(async (req, res) => {
  console.log("signup api hit");
  const { name, email, password } = req.body;

  if (!email || !password)
    return sendResponse(res, 400, "Email and password required");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });

  if (error) return sendResponse(res, 400, error.message, null);
  console.log("data :>> ", data);
  return sendResponse(res, 201, "Signup successful");
});

export const logout = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.auth.signOut();

  if (error) return sendResponse(res, 400, error.message, null);
  return sendResponse(res, 201, "Logout successful");
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.auth.refreshToken();

  if (error) return sendResponse(res, 400, error.message);
  return sendResponse(res, 200, "New refreshToken assigned", {
    refreshToken: data.session?.refreshToken,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("email :>> ", email);
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  console.log("data,error :>> ", data, error);
  
  if (error) return sendResponse(res, 400, error.message);
  return sendResponse(res, 200, "Reset link has been send");
});