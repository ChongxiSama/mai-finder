"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  FrameIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  InfoIcon,
  QuoteIcon,
  RectangleHorizontalIcon,
  SearchIcon,
  UserRoundIcon,
  UsersIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { prefetchSearchIndex, typeLabel, type Manifest } from "@/lib/items";

const TYPE_ICONS: Record<string, LucideIcon> = {
  icon: UserRoundIcon,
  plate: RectangleHorizontalIcon,
  frame: FrameIcon,
  chara: UsersIcon,
  partner: HeartIcon,
  title: QuoteIcon,
  photoFrame: ImageIcon,
};

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "首页", icon: HomeIcon },
  { href: "/search", label: "搜索", icon: SearchIcon },
  { href: "/data", label: "数据", icon: DatabaseIcon },
];

function isTabActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/browse");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ manifest }: { manifest: Manifest }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const primaryTypes = manifest.types.filter((type) => type.primary);
  const dataCount = manifest.types
    .filter((type) => !type.primary)
    .reduce((sum, type) => sum + type.count, 0);

  return (
    <aside
      className={`hidden shrink-0 p-3 transition-[width] duration-200 md:flex ${
        collapsed ? "w-[80px]" : "w-[288px]"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-border/60 bg-muted/25 shadow-[0_12px_48px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          {collapsed ? null : (
            <div className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight">
                mai-finder
              </div>
              <div className="pt-0.5 text-xs text-muted-foreground">
                舞萌DX收藏品/静态资源wiki
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
            className={`rounded-full text-muted-foreground ${
              collapsed ? "mx-auto" : ""
            }`}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </Button>
        </div>

        <nav className="scrollbar-none flex-1 overflow-y-auto px-2 pb-3">
          <div className="flex flex-col gap-0.5">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = isTabActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onPointerEnter={
                    item.href === "/search" ? prefetchSearchIndex : undefined
                  }
                  onFocus={
                    item.href === "/search" ? prefetchSearchIndex : undefined
                  }
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-full py-2.5 text-sm transition-colors ${
                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                  } ${
                    active
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-[18px]" />
                  {collapsed ? null : item.label}
                </Link>
              );
            })}
          </div>

          {collapsed ? null : (
            <>
              <p className="px-3 pt-5 pb-1 text-xs font-medium text-muted-foreground">
                资源分类
              </p>
              <div className="flex flex-col gap-0.5">
                {primaryTypes.map((type) => {
                  const Icon = TYPE_ICONS[type.key] ?? ImageIcon;
                  const active = pathname === `/browse/${type.key}`;
                  return (
                    <Link
                      key={type.key}
                      href={`/browse/${type.key}`}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-muted/80 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        {typeLabel(type.key)}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {type.count.toLocaleString("zh-CN")}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <p className="px-3 pt-5 pb-1 text-xs font-medium text-muted-foreground">
                数据
              </p>
              <Link
                href="/data"
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                  pathname.startsWith("/data")
                    ? "bg-muted/80 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <DatabaseIcon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">其他 XML 数据</span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {dataCount.toLocaleString("zh-CN")}
                </span>
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-border/60 p-2">
          <div className="flex items-center gap-1">
            <Link
              href="/about"
              title={collapsed ? "关于" : undefined}
              className={`flex min-w-0 flex-1 items-center rounded-full py-2 text-sm transition-colors ${
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              } ${
                pathname === "/about"
                  ? "bg-muted font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <InfoIcon className="size-4" />
              {collapsed ? null : "关于"}
            </Link>
            <ThemeToggle />
          </div>
          <p
            className={`pt-1 text-[11px] text-muted-foreground ${
              collapsed ? "text-center" : "px-3"
            }`}
          >
            {collapsed ? "v26" : `v26.0 · ${manifest.total.toLocaleString("zh-CN")} 项`}
          </p>
        </div>
      </div>
    </aside>
  );
}
