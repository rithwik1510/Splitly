import type { NextFunction, Request, Response } from "express";
import { JWT_COOKIE_NAME } from "@splitwise/shared";
import { AppError } from "../utils/app-error";
import { verifyAccessToken } from "../utils/token";

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  const cookieToken = req.cookies?.[JWT_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return undefined;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch (error) {
    console.warn("Failed to verify token", error);
  }

  next();
}