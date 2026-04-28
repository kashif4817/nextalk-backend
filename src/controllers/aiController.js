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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const writeEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: message,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) writeEvent("chunk", { text });
    }

    writeEvent("done", { ok: true });
    res.end();
  } catch (err) {
    console.log(err);
    writeEvent("error", { message: "AI request failed" });
    res.end();
  }
});
