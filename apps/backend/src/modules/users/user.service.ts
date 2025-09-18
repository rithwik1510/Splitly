import type { Prisma, User } from "@prisma/client";
import { prisma } from "../../config/prisma";

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export async function searchUsers(query: string, excludeUserId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: {
      name: "asc",
    },
  });
}

export function sanitizeUser(user: User) {
  const { id, email, name, createdAt, updatedAt } = user;
  return { id, email, name, createdAt, updatedAt };
}
