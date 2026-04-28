import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { chatWithAI } from "../controllers/aiController.js";

const router = express.Router();

router.post("/ai/chat", authMiddleware, chatWithAI);

export default router;
