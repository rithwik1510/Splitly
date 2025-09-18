"use client";



import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { Loader2, ShieldCheck, UserRound, Users } from "lucide-react";

import type { LucideIcon } from "lucide-react";

import { toast } from "sonner";

import { Card } from "@/components/ui/card";

import { Button, buttonVariants } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { useAuth } from "@/hooks/useAuth";

import { fetchGroups } from "@/lib/groups";

import type { GroupSummary } from "@/lib/types";



interface ProfilePreferences {

  displayName: string;

  bio: string;

  newsletters: boolean;

}



const PROFILE_STORAGE_KEY = "splitly:profile-preferences";



export default function ProfilePage() {

  const { user } = useAuth({ requireAuth: true });

  const router = useRouter();



  const groupsQuery = useQuery({

    queryKey: ["profile", "groups"],

    queryFn: fetchGroups,

    enabled: Boolean(user),

  });



  const [preferences, setPreferences] = useState<ProfilePreferences>(() => ({

    displayName: user?.name ?? "",

    bio: "",

    newsletters: true,

  }));



  useEffect(() => {

    if (!user || typeof window === "undefined") {

      return;

    }

    const stored = window.localStorage.getItem(`${PROFILE_STORAGE_KEY}:${user.id}`);

    if (stored) {

      try {

        const parsed = JSON.parse(stored) as ProfilePreferences;

        setPreferences({

          displayName: parsed.displayName || user.name,

          bio: parsed.bio ?? "",

          newsletters: parsed.newsletters ?? true,

        });

      } catch (error) {

        console.warn("Unable to parse stored profile preferences", error);

      }

    } else {

      setPreferences((prev) => ({ ...prev, displayName: user.name }));

    }

  }, [user]);



  const totalGroups = groupsQuery.data?.length ?? 0;

  const uniqueMemberCount = useMemo(() => {

    if (!groupsQuery.data) {

      return 0;

    }

    const memberIds = new Set<string>();

    groupsQuery.data.forEach((group) => {

      group.members.forEach((member) => {

        if (member.user.id !== user?.id) {

          memberIds.add(member.user.id);

        }

      });

    });

    return memberIds.size;

  }, [groupsQuery.data, user?.id]);



  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    if (!user || typeof window === "undefined") {

      return;

    }

    window.localStorage.setItem(

      `${PROFILE_STORAGE_KEY}:${user.id}`,

      JSON.stringify(preferences)

    );

    toast.success("Profile preferences saved");

  };



  const handleReset = () => {

    if (!user || typeof window === "undefined") {

      return;

    }

    window.localStorage.removeItem(`${PROFILE_STORAGE_KEY}:${user.id}`);

    setPreferences({ displayName: user.name, bio: "", newsletters: true });

    toast.success("Profile preferences reset");

  };





  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    const target = event.target as HTMLInputElement | HTMLTextAreaElement;

    const { name } = target;

    if (target instanceof HTMLInputElement) {

      setPreferences((prev) => ({

        ...prev,

        [name]: target.type === "checkbox" ? target.checked : target.value,

      }));

      return;

    }

    setPreferences((prev) => ({

      ...prev,

      [name]: target.value,

    }));

  };



  return (

    <div className="space-y-8">

      <header className="flex flex-wrap items-center justify-between gap-3">

        <div className="space-y-1">

          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Your profile</h1>

          <p className="text-sm text-slate-500 dark:text-slate-400">

            Keep your details up to date and understand how you collaborate across Splitly.

          </p>

        </div>

        <Button variant="secondary" onClick={() => router.push("/split")}>

          Back to dashboard

        </Button>

      </header>



      <section className="grid gap-6 lg:grid-cols-12">

        <Card className="space-y-4 lg:col-span-4">

          <div className="space-y-2">

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account snapshot</h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">

              A quick overview of your activity and reach.

            </p>

          </div>

          <div className="grid gap-3">

            <SnapshotTile

              icon={UserRound}

              label="Display name"

              value={preferences.displayName || user?.name || "Unknown"}

            />

            <SnapshotTile icon={Users} label="Active groups" value={String(totalGroups)} />

            <SnapshotTile icon={ShieldCheck} label="Connections" value={String(uniqueMemberCount)} />

          </div>

        </Card>



        <Card className="space-y-6 lg:col-span-8">

          <div className="space-y-1">

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal details</h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">

              These details help teammates recognize you and personalise balances.

            </p>

          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="space-y-1.5">

                <Label htmlFor="displayName">Display name</Label>

                <Input

                  id="displayName"

                  name="displayName"

                  value={preferences.displayName}

                  onChange={handleInputChange}

                  maxLength={48}

                  required

                  autoComplete="name"

                />

              </div>

              <div className="space-y-1.5">

                <Label htmlFor="email">Email</Label>

                <Input id="email" value={user?.email ?? ""} disabled />

              </div>

            </div>

            <div className="space-y-1.5">

              <Label htmlFor="bio">About you</Label>

              <textarea

                id="bio"

                name="bio"

                value={preferences.bio}

                onChange={handleInputChange}

                rows={4}

                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"

                placeholder="Add a short note so people know who they are splitting with."

              />

            </div>

            <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">

              <input

                type="checkbox"

                name="newsletters"

                checked={preferences.newsletters}

                onChange={handleInputChange}

                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />

              <span>

                Keep me in the loop with product updates and smart tips for settlements.

              </span>

            </label>

            <div className="flex flex-wrap items-center gap-3">

              <Button type="submit" variant="default">

                Save changes

              </Button>

              <Button type="button" variant="secondary" onClick={handleReset}>

                Reset

              </Button>

            </div>

          </form>

        </Card>

      </section>



      <section aria-live="polite">

        <Card className="space-y-4">

          <div className="flex items-center justify-between">

            <div className="space-y-1">

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Group memberships</h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Track where your balances live and jump back into collaboration quickly.

              </p>

            </div>

            <Link href="/groups" className={buttonVariants({ variant: "secondary" })}>
              Manage groups
            </Link>

          </div>

          {groupsQuery.isLoading ? (

            <div className="flex h-32 items-center justify-center text-slate-500 dark:text-slate-400" role="status" aria-live="polite">

              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Loading memberships...

            </div>

          ) : groupsQuery.isError ? (

            <p className="text-sm text-red-500" role="alert">We could not load your groups right now. Please try again shortly.</p>

          ) : groupsQuery.data && groupsQuery.data.length > 0 ? (

            <div className="grid gap-3 sm:grid-cols-2">

              {groupsQuery.data.map((group) => (

                <GroupTile key={group.id} group={group} />

              ))}

            </div>

          ) : (

            <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">

              No groups yet. Create your first one to start sharing expenses.

            </div>

          )}

        </Card>

      </section>

    </div>

  );

}



function SnapshotTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {

  return (

    <div className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/60">

      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">

        <Icon className="h-4 w-4 text-brand" aria-hidden="true" />

        <span>{label}</span>

      </div>

      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>

    </div>

  );

}



function GroupTile({ group }: { group: GroupSummary }) {

  const memberCount = group.members.length;



  return (

    <div className="rounded-lg border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">

      <div className="flex items-center justify-between">

        <div>

          <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>

          <p className="text-xs text-slate-500 dark:text-slate-400">

            {memberCount} {memberCount === 1 ? "member" : "members"}

          </p>

        </div>

        <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">

          {group.baseCurrency}

        </span>

      </div>

      {group.description && (

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{group.description}</p>

      )}

    </div>

  );

}



