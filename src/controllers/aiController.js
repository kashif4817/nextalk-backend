import { GoogleGenAI } from "@google/genai";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const chatWithAI = asyncHandler(async (req, res) => {
  console.log("chatWithAI hit");
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return sendResponse(res, 400, "message is required");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
    });

    const reply = response.text;
    if (!reply) return sendResponse(res, 502, "Empty response from AI");

    return sendResponse(res, 200, "AI replied", { reply });
  } catch (err) {
    console.log(err);
    return sendResponse(res, 500, "AI request failed");
  }
});
