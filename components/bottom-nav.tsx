"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, InfoIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prefetchSearchIndex } from "@/lib/items";

const TABS = [
  {
    href: "/",
    label: "首页",
    icon: HomeIcon,
    active: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/browse"),
  },
  {
    href: "/about",
    label: "关于",
    icon: InfoIcon,
    active: (pathname: string) => pathname.startsWith("/about"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/search")) {
    return null;
  }

  const activeIndex = TABS.findIndex((tab) => tab.active(pathname));

  return (
    <nav className="app-nav pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 md:hidden">
      <div className="pointer-events-auto relative flex w-[188px] items-center rounded-full border border-border/50 bg-background/70 p-0.5 shadow-lg backdrop-blur-xl">
        {activeIndex >= 0 ? (
          <span
            aria-hidden
            className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-muted shadow-sm transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
            style={{
              width: `calc((100% - 4px) / ${TABS.length})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        ) : null}
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.active(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-xs transition-colors duration-300 ${
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="size-[18px]" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="icon-lg"
        aria-label="搜索资源"
        nativeButton={false}
        onPointerDown={prefetchSearchIndex}
        className="pointer-events-auto size-12 rounded-full border-border/50 bg-background/70 shadow-lg backdrop-blur-xl"
        render={<Link href="/search" />}
      >
        <SearchIcon />
      </Button>
    </nav>
  );
}
