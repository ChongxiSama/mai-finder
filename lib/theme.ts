"use client";

import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

const STORAGE_KEY = "theme";
const SSR_STATE: ThemeState = { preference: "system", resolved: "light" };

let state: ThemeState = SSR_STATE;
let bound = false;
const listeners = new Set<() => void>();

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
  } catch {
    return "system";
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function apply(preference: ThemePreference): ResolvedTheme {
  const resolved = preference === "system" ? systemTheme() : preference;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;
  root.dataset.theme = preference;
  return resolved;
}

function sync() {
  const preference = readPreference();
  const resolved = apply(preference);
  state = { preference, resolved };
  for (const listener of listeners) {
    listener();
  }
}

function bind() {
  if (bound || typeof window === "undefined") {
    return;
  }
  bound = true;

  const preference = readPreference();
  state = { preference, resolved: apply(preference) };

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (state.preference === "system") {
        sync();
      }
    });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      sync();
    }
  });
}

export function setThemePreference(
  preference: ThemePreference,
  origin?: { x: number; y: number },
) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch (error) {
    void error;
  }

  if (typeof document === "undefined") {
    return;
  }

  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!doc.startViewTransition || reduce) {
    sync();
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  root.style.setProperty("--theme-reveal-x", `${x}px`);
  root.style.setProperty("--theme-reveal-y", `${y}px`);
  root.style.setProperty("--theme-reveal-r", `${radius}px`);

  try {
    doc.startViewTransition(() => sync());
  } catch (error) {
    void error;
    sync();
  }
}

function subscribe(listener: () => void) {
  bind();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ThemeState {
  bind();
  return state;
}

function getServerSnapshot(): ThemeState {
  return SSR_STATE;
}

export function useTheme(): ThemeState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
