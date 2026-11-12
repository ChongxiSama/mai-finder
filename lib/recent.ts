"use client";

import { useMemo, useSyncExternalStore } from "react";

import { type ItemRecord, itemKey } from "@/lib/items";

const ITEMS_KEY = "mai-finder:recent-items";
const SEARCHES_KEY = "mai-finder:recent-searches";
const MAX_ITEMS = 12;
const MAX_SEARCHES = 6;

const listeners = new Set<() => void>();

export type RecentItem = {
  type: string;
  dataName: string;
  name: string;
  thumb: string | null;
};

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parseRecentSearches(raw: string): string[] {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

export function useRecentSearches(): string[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(SEARCHES_KEY) ?? "[]",
    () => "[]",
  );

  return useMemo(() => parseRecentSearches(raw), [raw]);
}

function parseRecentItems(raw: string): RecentItem[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (entry): entry is RecentItem =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as RecentItem).type === "string" &&
        typeof (entry as RecentItem).dataName === "string" &&
        typeof (entry as RecentItem).name === "string" &&
        (typeof (entry as RecentItem).thumb === "string" ||
          (entry as RecentItem).thumb === null),
    );
  } catch {
    return [];
  }
}

export function useRecentItems(): RecentItem[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(ITEMS_KEY) ?? "[]",
    () => "[]",
  );

  return useMemo(() => parseRecentItems(raw), [raw]);
}

export function addRecentItem(item: ItemRecord) {
  if (typeof window === "undefined") {
    return;
  }

  const current = parseRecentItems(
    window.localStorage.getItem(ITEMS_KEY) ?? "[]",
  );
  const key = itemKey(item);
  const next: RecentItem[] = [
    {
      type: item.type,
      dataName: item.dataName,
      name: item.name,
      thumb: item.thumb,
    },
    ...current.filter((entry) => itemKey(entry) !== key),
  ].slice(0, MAX_ITEMS);

  window.localStorage.setItem(ITEMS_KEY, JSON.stringify(next));
  notify();
}

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  return parseRecentSearches(
    window.localStorage.getItem(SEARCHES_KEY) ?? "[]",
  );
}

export function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return;
  }

  const next = [
    trimmed,
    ...getRecentSearches().filter((entry) => entry !== trimmed),
  ].slice(0, MAX_SEARCHES);

  window.localStorage.setItem(SEARCHES_KEY, JSON.stringify(next));
  notify();
}
