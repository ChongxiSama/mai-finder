"use client";

import { useRef } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  setThemePreference,
  useTheme,
  type ThemePreference,
} from "@/lib/theme";

const MODES: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟随系统" },
];

export function ThemeSetting() {
  const { preference } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between gap-4"
    >
      <span className="text-sm">主题</span>
      <ToggleGroup
        variant="outline"
        size="sm"
        value={[preference]}
        onValueChange={(values) => {
          const next = values[0];
          if (next === "light" || next === "dark" || next === "system") {
            const rect = containerRef.current?.getBoundingClientRect();
            setThemePreference(
              next,
              rect
                ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                : undefined,
            );
          }
        }}
      >
        {MODES.map((mode) => (
          <ToggleGroupItem
            key={mode.value}
            value={mode.value}
            className="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {mode.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
