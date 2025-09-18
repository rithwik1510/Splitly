import api from "./api-client";
import type { User } from "./types";

export async function searchUsers(query: string): Promise<User[]> {
  if (!query) return [];
  const { data } = await api.get<{ users: User[] }>("/users/search", { params: { q: query } });
  return data.users;
}