import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { findUserById, sanitizeUser, searchUsers } from "./user.service";

const router = Router();

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.user!.sub);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    res.json({ user: sanitizeUser(user) });
  })
);

router.get(
  "/search",
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (query.length === 0) {
      return res.json({ users: [] });
    }

    const users = await searchUsers(query, req.user!.sub);
    res.json({ users: users.map(sanitizeUser) });
  })
);

export const usersRouter = router;