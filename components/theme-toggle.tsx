"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  setThemePreference,
  useTheme,
  type ThemePreference,
} from "@/lib/theme";

const MODES: ThemePreference[] = ["light", "dark", "system"];

const LABELS: Record<ThemePreference, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { preference } = useTheme();

  const next =
    MODES[(MODES.indexOf(preference) + 1) % MODES.length] ?? "system";
  const Icon =
    preference === "light"
      ? SunIcon
      : preference === "dark"
        ? MoonIcon
        : MonitorIcon;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={`主题：${LABELS[preference]}，点击切换`}
      title={`主题：${LABELS[preference]}`}
      onClick={(event) =>
        setThemePreference(next, {
          x: event.clientX,
          y: event.clientY,
        })
      }
    >
      <Icon />
    </Button>
  );
}
