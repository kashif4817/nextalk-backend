import morgan from "morgan";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { validateEnv } from "./src/config/env.js";

dotenv.config();
validateEnv();

const app = express();

app.use(morgan("dev"));
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/auth/callback", async function (req, res) {
  const code = req.query.code;
  const next = req.query.next ?? "/";

  if (code) {
    const supabase = createServerClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(req.headers.cookie ?? "");
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.appendHeader(
                "Set-Cookie",
                serializeCookieHeader(name, value, options),
              ),
            );
            Object.entries(headers).forEach(([key, value]) =>
              res.setHeader(key, value),
            );
          },
        },
      },
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  res.redirect(303, `/${next.slice(1)}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
