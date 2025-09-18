import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
  name: string;
}

const accessOptions: jwt.SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
};

const refreshOptions: jwt.SignOptions = {
  expiresIn: env.REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
};

export function createAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, accessOptions);
}

export function createRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.REFRESH_JWT_SECRET as jwt.Secret, refreshOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET as jwt.Secret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.REFRESH_JWT_SECRET as jwt.Secret) as TokenPayload;
}

export type { TokenPayload };