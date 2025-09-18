import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { JWT_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@splitwise/shared";
import { env } from "../../config/env";
import { authRateLimiter } from "../../middleware/rate-limit";
import { AppError } from "../../utils/app-error";
import { asyncHandler } from "../../utils/async-handler";
import { login, register } from "./auth.service";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(120),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  const secure = env.NODE_ENV === "production";
  res.cookie(JWT_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  });
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

router.post(
  "/register",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await register(body);
    setAuthCookies(res, result);
    res.status(201).json(result);
  })
);

router.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await login(body);
    setAuthCookies(res, result);
    res.json(result);
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(JWT_COOKIE_NAME);
  res.clearCookie(REFRESH_COOKIE_NAME);
  res.status(204).send();
});

router.get("/google", (_req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError("Google OAuth not configured", 503, "OAUTH_NOT_CONFIGURED");
  }
  res.status(501).json({ message: "Google OAuth flow to be implemented" });
});

export const authRouter = router;