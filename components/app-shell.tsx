"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Toaster } from "sonner";

import { useTheme } from "@/lib/theme";

import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import type { Manifest } from "@/lib/items";

export function AppShell({
  manifest,
  children,
}: {
  manifest: Manifest;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolved } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        router.push("/search");
        return;
      }

      if (event.key !== "/" || event.metaKey || event.ctrlKey) {
        return;
      }

      const target = event.target instanceof HTMLElement ? event.target : null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        document.querySelector('[role="dialog"]')
      ) {
        return;
      }

      event.preventDefault();
      router.push("/search");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <Sidebar manifest={manifest} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          data-app-scroll
          className="scrollbar-none flex-1 overflow-y-auto overscroll-contain"
        >
          <div
            key={pathname}
            className={`page-in min-h-full ${
              pathname.startsWith("/search") ? "pb-6" : "app-content"
            }`}
          >
            {children}
          </div>
        </div>
      </div>

      <BottomNav />
      <Toaster theme={resolved} position="top-center" />
    </div>
  );
}
