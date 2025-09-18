"use client";

import { useState } from "react";
import { useDebounce } from "usehooks-ts";
import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "@/lib/users";
import type { User } from "@/lib/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

interface MemberSearchProps {
  onSelect: (user: User) => void;
}

export function MemberSearch({ onSelect }: MemberSearchProps) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);

  const resultsQuery = useQuery({
    queryKey: ["members", debounced],
    queryFn: () => searchUsers(debounced),
    enabled: debounced.length > 1,
  });

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or email"
      />
      {resultsQuery.isFetching && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Spinner size={16} /> Searching...
        </div>
      )}
      {resultsQuery.data && resultsQuery.data.length > 0 && (
        <div className="space-y-1">
          {resultsQuery.data.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-md border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
              <Button size="sm" onClick={() => onSelect(user)}>
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
      {resultsQuery.data && resultsQuery.data.length === 0 && debounced.length > 1 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No matching users</p>
      )}
    </div>
  );
}
