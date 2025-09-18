import type { Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export function errorHandler(error: unknown, _req: Request, res: Response) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      issues: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
    });
  }

  console.error("Unhandled error", error);
  return res.status(500).json({
    message: "Internal server error",
  });
}

