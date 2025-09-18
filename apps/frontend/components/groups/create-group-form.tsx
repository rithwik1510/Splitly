"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORTED_CURRENCIES } from "@splitwise/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import type { GroupSummary } from "@/lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import { createGroup } from "@/lib/groups";

interface CreateGroupFormProps {
  onCreated?: (group: GroupSummary) => void;
}

const schema = z.object({
  name: z.string().min(2),
  description: z.string().max(300).optional(),
  baseCurrency: z.enum(SUPPORTED_CURRENCIES as any),
});

export function CreateGroupForm({ onCreated }: CreateGroupFormProps = {}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      baseCurrency: "USD",
    },
  });

  const baseCurrencyError = errors.baseCurrency?.message as string | undefined;

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (group) => {
      toast.success(`Created ${group.name}`);
      onCreated?.(group);
      void queryClient.invalidateQueries({ queryKey: ["groups"] });
      reset({ name: "", description: "", baseCurrency: group.baseCurrency as any });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not create the group. Check the details and try again.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({
      name: values.name,
      description: values.description,
      baseCurrency: values.baseCurrency,
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <Label htmlFor="group-name">Group name</Label>
        <Input id="group-name" placeholder="Weekend Trip" {...register("name")} />
        {errors.name?.message && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="md:col-span-1">
        <Label htmlFor="group-description">Description</Label>
        <Input id="group-description" placeholder="Optional" {...register("description")} />
        {errors.description?.message && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>
      <div className="md:col-span-1">
        <Label htmlFor="base-currency">Base currency</Label>
        <select
          id="base-currency"
          className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          {...register("baseCurrency")}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        {baseCurrencyError && <p className="text-xs text-red-500">{baseCurrencyError}</p>}
      </div>
      <div className="md:col-span-3 flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size={18} /> : "Create group"}
        </Button>
      </div>
    </form>
  );
}

