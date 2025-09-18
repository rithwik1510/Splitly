"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface UserSettings {
  defaultCurrency: string;
  autoSimplify: boolean;
  weeklySummary: boolean;
  smartReminders: boolean;
  pushNotifications: boolean;
  preferredTheme: "system" | "light" | "dark";
}

const SETTINGS_STORAGE_KEY = "splitly:user-settings";

const DEFAULT_SETTINGS: UserSettings = {
  defaultCurrency: "USD",
  autoSimplify: true,
  weeklySummary: true,
  smartReminders: true,
  pushNotifications: true,
  preferredTheme: "system",
};

export default function SettingsPage() {
  useAuth({ requireAuth: true });
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn("Unable to parse saved settings", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!theme) {
      return;
    }
    setSettings((prev) => ({ ...prev, preferredTheme: theme as UserSettings["preferredTheme"] }));
  }, [theme]);

  const handleToggle = (key: keyof UserSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings((prev) => ({ ...prev, defaultCurrency: event.target.value }));
  };

  const handleThemeChange = (value: UserSettings["preferredTheme"]) => {
    setSettings((prev) => ({ ...prev, preferredTheme: value }));
    setTheme(value);
  };

  const handleSave = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved");
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setTheme(DEFAULT_SETTINGS.preferredTheme);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tailor Splitly to your habits — currencies, reminders, and how balances are presented.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/split")}>
          Back to dashboard
        </Button>
      </header>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="space-y-6 p-6 lg:col-span-8">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Expense defaults</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pick the options we should pre-fill each time you create a split.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default currency</Label>
              <select
                id="defaultCurrency"
                value={settings.defaultCurrency}
                onChange={handleCurrencyChange}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleThemeChange(option.value)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                      settings.preferredTheme === option.value
                        ? "border-brand bg-brand/10 text-slate-900 dark:border-brand dark:bg-brand/20 dark:text-white"
                        : "border-slate-200 text-slate-600 hover:border-brand hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ToggleField
              label="Simplify balances automatically"
              description="Let Splitly suggest simplified pay-offs after new expenses."
              checked={settings.autoSimplify}
              onClick={() => handleToggle("autoSimplify")}
            />
            <ToggleField
              label="Weekly summary email"
              description="Receive a recap every Monday with outstanding balances."
              checked={settings.weeklySummary}
              onClick={() => handleToggle("weeklySummary")}
            />
            <ToggleField
              label="Smart reminders"
              description="Nudge your groups when a balance stays untouched for a while."
              checked={settings.smartReminders}
              onClick={() => handleToggle("smartReminders")}
            />
            <ToggleField
              label="Push notifications"
              description="Get a ping when someone updates a group you follow."
              checked={settings.pushNotifications}
              onClick={() => handleToggle("pushNotifications")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave}>
              Save settings
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset}>
              Reset to defaults
            </Button>
          </div>
        </Card>
        <Card className="space-y-3 p-6 lg:col-span-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Data & privacy</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your preferences live in your browser so you can experiment freely. We only sync sensitive data when you explicitly save an expense or invite someone new.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Change of mind? Clearing your browser storage removes these personal settings without touching your core balances.
          </p>
        </Card>
      </section>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onClick,
}: {
  label: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${
        checked
          ? "border-brand bg-brand/10 text-slate-900 dark:border-brand dark:bg-brand/20 dark:text-white"
          : "border-slate-200 text-slate-600 hover:border-brand hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand"
      }`}
      aria-pressed={checked}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <span
        className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
          checked
            ? "border-brand bg-brand/80 text-white"
            : "border-slate-300 text-slate-400"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

const THEME_OPTIONS: Array<{ label: string; value: "system" | "light" | "dark" }> = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

