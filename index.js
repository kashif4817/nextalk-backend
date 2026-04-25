import http from "http";
import { Server } from "socket.io";

import socketAuthMiddleware from "./src/sockets/middleware/socketAuthMiddleware.js";
import socketHandler from "./src/sockets/socketHandler.js";

import morgan from "morgan";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { validateEnv } from "./src/config/env.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import blockRoutes from "./src/routes/blockRoutes.js";
import conversationRoutes from "./src/routes/conversationRoutes.js";
import messageRoutes from "./src/routes/messageRoutes.js";

dotenv.config();
validateEnv();
const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin:FRONTEND_URL, credentials: true },
});

io.use(socketAuthMiddleware);
io.on("connection", socketHandler(io));

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", contactRoutes);
app.use("/api", blockRoutes);
app.use("/api", conversationRoutes);
app.use("/api", messageRoutes);

app.get("/", (req, res) => {
  res.send("Hello world!");
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT)

export default app;
