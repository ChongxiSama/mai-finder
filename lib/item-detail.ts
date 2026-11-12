"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { itemKey, type ItemRecord } from "@/lib/items";

type HistoryState = { itemOpen?: boolean } | null;

function subscribeHash(listener: () => void) {
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  return () => {
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
}

function getHashSnapshot(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.hash;
}

function getServerHashSnapshot(): string {
  return "";
}

function keyFromHash(hash: string): string | null {
  if (!hash.startsWith("#item=")) {
    return null;
  }

  try {
    return decodeURIComponent(hash.slice(6));
  } catch {
    return null;
  }
}

function hashForKey(key: string): string {
  return `#item=${encodeURIComponent(key)}`;
}

export function useItemDetail(
  allItems: ItemRecord[],
  navigationItems: ItemRecord[],
) {
  const hash = useSyncExternalStore(
    subscribeHash,
    getHashSnapshot,
    getServerHashSnapshot,
  );
  const activeKey = keyFromHash(hash);

  const selected = useMemo(() => {
    if (activeKey === null) {
      return null;
    }
    return allItems.find((item) => itemKey(item) === activeKey) ?? null;
  }, [activeKey, allItems]);

  const activeNavigation = useMemo(() => {
    if (
      selected === null ||
      activeKey === null ||
      navigationItems.some((item) => itemKey(item) === activeKey)
    ) {
      return navigationItems;
    }
    return allItems;
  }, [selected, activeKey, navigationItems, allItems]);

  const index = selected
    ? activeNavigation.findIndex((item) => itemKey(item) === activeKey)
    : -1;

  const pushDetail = useCallback((item: ItemRecord, mode: "push" | "replace") => {
    const nextHash = hashForKey(itemKey(item));
    if (window.location.hash === nextHash) {
      return;
    }

    const state = { ...(window.history.state ?? {}), itemOpen: true };
    if (mode === "push") {
      window.history.pushState(state, "", nextHash);
    } else {
      window.history.replaceState(state, "", nextHash);
    }
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const openItem = useCallback(
    (item: ItemRecord) => pushDetail(item, "push"),
    [pushDetail],
  );

  const closeItem = useCallback(() => {
    const state = window.history.state as HistoryState;
    if (state?.itemOpen) {
      window.history.back();
      return;
    }

    window.history.replaceState(
      state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const goTo = (offset: number) => {
    if (index < 0) {
      return;
    }
    const target = activeNavigation[index + offset];
    if (target) {
      pushDetail(target, "replace");
    }
  };

  return {
    selected,
    index,
    total: activeNavigation.length,
    openItem,
    closeItem,
    goPrev: () => goTo(-1),
    goNext: () => goTo(1),
    canPrev: index > 0,
    canNext: index >= 0 && index < activeNavigation.length - 1,
  };
}
