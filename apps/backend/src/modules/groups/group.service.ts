import type { GroupMember, Prisma, User } from "@prisma/client";
import { GroupRole } from "@splitwise/shared";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";

export async function listGroupsForUser(userId: string) {
  return prisma.group.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createGroupForUser(
  userId: string,
  data: Pick<Prisma.GroupCreateInput, "name" | "description" | "baseCurrency">
) {
  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      baseCurrency: data.baseCurrency,
      createdBy: {
        connect: { id: userId },
      },
      members: {
        create: {
          user: { connect: { id: userId } },
          role: GroupRole.ADMIN,
        },
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function ensureGroupMember(
  groupId: string,
  userId: string,
  options: { requireAdmin?: boolean } = {}
): Promise<GroupMember & { user: User }> {
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
    },
    include: {
      user: true,
    },
  });
  if (!membership) {
    throw new AppError("You do not have access to this group", 403, "GROUP_ACCESS_DENIED");
  }

  if (options.requireAdmin && membership.role !== GroupRole.ADMIN) {
    throw new AppError("Only admins can perform this action", 403, "GROUP_ADMIN_ONLY");
  }

  return membership;
}

export async function addMemberToGroup(groupId: string, userId: string, addedById: string) {
  await ensureGroupMember(groupId, addedById, { requireAdmin: true });
  if (userId === addedById) {
    throw new AppError("You are already a member", 400, "MEMBER_EXISTS");
  }

  const existing = await prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
  if (existing) {
    throw new AppError("User already in group", 400, "MEMBER_EXISTS");
  }

  return prisma.groupMember.create({
    data: {
      group: { connect: { id: groupId } },
      user: { connect: { id: userId } },
      role: GroupRole.MEMBER,
    },
    include: {
      user: true,
    },
  });
}

export async function getGroupDetail(groupId: string, userId: string) {
  await ensureGroupMember(groupId, userId);
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: {
          user: {
            name: "asc",
          },
        },
      },
      expenses: {
        include: {
          paidBy: true,
          shares: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          occurredAt: "desc",
        },
      },
      settlements: {
        include: {
          from: true,
          to: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
