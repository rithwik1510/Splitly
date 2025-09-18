import { isAxiosError } from "axios";
import api, { setAuthHeader } from "./api-client";
import type { AuthResponse, User } from "./types";

const STORAGE_KEY = "splitwiseplus.accessToken";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function bootstrapAuth() {
  const token = getStoredToken();
  if (token) {
    setAuthHeader(token);
  }
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  setStoredToken(data.accessToken);
  setAuthHeader(data.accessToken);
  return data;
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password });
  setStoredToken(data.accessToken);
  setAuthHeader(data.accessToken);
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
  setStoredToken(null);
  setAuthHeader(undefined);
}

export async function currentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<{ user: User }>("/users/me");
    return data.user;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    throw error;
  }
}

if (typeof window !== "undefined") {
  bootstrapAuth();
}