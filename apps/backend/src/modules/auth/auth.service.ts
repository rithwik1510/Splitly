import type { User } from "@prisma/client";
import { AppError } from "../../utils/app-error";
import { hashPassword, verifyPassword } from "../../utils/password";
import { createAccessToken, createRefreshToken } from "../../utils/token";
import { createUser, findUserByEmail, sanitizeUser } from "../users/user.service";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function buildTokenPayload(user: User) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function register(data: RegisterInput) {
  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(data.password);
  const user = await createUser({
    email: data.email,
    passwordHash,
    name: data.name,
  });

  const payload = buildTokenPayload(user);
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(data: LoginInput) {
  const user = await findUserByEmail(data.email);
  if (!user || !user.passwordHash) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const isValid = await verifyPassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const payload = buildTokenPayload(user);
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}