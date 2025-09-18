"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { currentUser, login, logout, register } from "@/lib/auth";
import type { User } from "@/lib/types";

interface UseAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  redirectIfAuthenticatedTo?: string;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { requireAuth = false, redirectTo = "/login", redirectIfAuthenticatedTo } = options;

  const queryClient = useQueryClient();
  const router = useRouter();

  const userQuery = useQuery<User | null>({
    queryKey: ["auth", "user"],
    queryFn: currentUser,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if ((error as any)?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["auth", "user"], user);
      router.push("/split");
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["auth", "user"], user);
      router.push("/split");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["auth"] });
      router.push("/login");
    },
  });

  useEffect(() => {
    if (!userQuery.isLoading && requireAuth && !userQuery.data) {
      router.push(redirectTo);
    }
  }, [requireAuth, redirectTo, router, userQuery.data, userQuery.isLoading]);

  useEffect(() => {
    if (!userQuery.isLoading && userQuery.data && redirectIfAuthenticatedTo) {
      router.push(redirectIfAuthenticatedTo);
    }
  }, [redirectIfAuthenticatedTo, router, userQuery.data, userQuery.isLoading]);

  return {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    isAuthenticated: Boolean(userQuery.data),
    login: loginMutation.mutateAsync,
    loginStatus: loginMutation.status,
    loginIsPending: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerStatus: registerMutation.status,
    registerIsPending: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    logoutStatus: logoutMutation.status,
    logoutIsPending: logoutMutation.isPending,
    refetchUser: userQuery.refetch,
  };
}