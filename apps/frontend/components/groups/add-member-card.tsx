"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addGroupMember } from "@/lib/groups";
import { Card } from "../ui/card";
import { MemberSearch } from "./member-search";

interface AddMemberCardProps {
  groupId: string;
}

export function AddMemberCard({ groupId }: AddMemberCardProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string) => addGroupMember(groupId, userId),
    onSuccess: () => {
      toast.success("Member added");
      void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not add that member. Refresh and try again.");
    },
  });

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add members</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Invite teammates or friends by searching for their email or name.
        </p>
      </div>
      <MemberSearch onSelect={(user) => mutation.mutate(user.id)} />
    </Card>
  );
}
