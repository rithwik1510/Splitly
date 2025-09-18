"use client";

import { Fragment, ReactNode } from "react";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDown, Clock3, LogOut as LogOutIcon, Settings, UserRound } from "lucide-react";
import { Container } from "@/components/layout/container";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-50 -translate-y-20 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-brand/40"
      >
        Skip to main content
      </a>
      <header
        className="relative z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80"
        role="banner"
      >
        <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
          <Link
            href="/split"
            className="text-lg font-semibold text-slate-900 transition hover:text-brand dark:text-white dark:hover:text-brand"
          >
            Splitly
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center">
            <AppHeaderActions />
          </nav>
        </Container>
      </header>
      <main id="main-content" className="flex-1 py-8" role="main">
        <Container className="pb-16">{children}</Container>
      </main>
      <footer
        className="border-t border-slate-200/70 bg-white/70 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400"
        role="contentinfo"
      >
        <Container className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-slate-600 dark:text-slate-300">
            Splitly - Shared expenses made simple.
          </p>
          <p className="text-xs">
            Crafted for light & dark modes - Best on modern evergreen browsers.
          </p>
        </Container>
      </footer>
    </div>
  );
}

function AppHeaderActions() {
  const { user, logout, logoutIsPending } = useAuth({ requireAuth: true });

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">Hi, {user.name}</span>
      <ProfileMenu user={user} onLogout={logout} logoutDisabled={logoutIsPending} />
    </div>
  );
}

interface ProfileMenuProps {
  user: User;
  onLogout: () => Promise<void>;
  logoutDisabled: boolean;
}

function ProfileMenu({ user, onLogout, logoutDisabled }: ProfileMenuProps) {
  const initials = getInitials(user.name);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-2 py-1 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-brand"
      >
        <span className="sr-only">Open profile menu</span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/15 text-sm font-semibold uppercase text-brand dark:bg-brand/25">
          {initials}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          aria-label="Profile options"
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl focus:outline-none dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <Link href="/profile" className={menuItemClass(active)}>
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Profile
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link href="/history" className={menuItemClass(active)}>
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  History
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <Link href="/settings" className={menuItemClass(active)}>
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Settings
                </Link>
              )}
            </Menu.Item>
          </div>
          <div className="border-t border-slate-200 pt-1 dark:border-slate-700">
            <Menu.Item disabled={logoutDisabled}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  disabled={logoutDisabled}
                  className={cn(
                    menuItemClass(active),
                    "w-full",
                    logoutDisabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function menuItemClass(active: boolean) {
  return cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
    active
      ? "bg-brand/10 text-slate-900 dark:bg-brand/20 dark:text-white"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || name.slice(0, 2).toUpperCase();
}
