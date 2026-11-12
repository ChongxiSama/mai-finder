"use client";

import Image from "next/image";
import Link from "next/link";
import { DatabaseIcon, ImageOffIcon, InfoIcon, SearchIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import {
  itemKey,
  typeLabel,
  type Manifest,
  type ManifestType,
} from "@/lib/items";
import { useRecentItems } from "@/lib/recent";

const SINGLE_PREVIEW_TYPES = new Set(["plate", "frame", "photoFrame"]);

function Preview({ type, eager }: { type: ManifestType; eager: boolean }) {
  if (type.preview.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/40">
        <span className="text-base font-medium text-muted-foreground">
          {typeLabel(type.key)}
        </span>
      </div>
    );
  }

  if (SINGLE_PREVIEW_TYPES.has(type.key) || type.preview.length === 1) {
    return (
      <div className="checkerboard relative h-full">
        <Image
          src={type.preview[0] ?? ""}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-contain p-4"
          priority={eager}
        />
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 gap-1 bg-muted/30 p-1.5">
      {type.preview.slice(0, 4).map((src, index) => (
        <div
          key={src}
          className="relative overflow-hidden rounded-md bg-background"
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 25vw, 12vw"
            className="object-contain p-1"
            priority={eager && index === 0}
          />
        </div>
      ))}
    </div>
  );
}

function CategoryCard({
  type,
  eager,
}: {
  type: ManifestType;
  eager: boolean;
}) {
  return (
    <Link
      href={`/browse/${type.key}`}
      className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <Card
        size="sm"
        className="h-full gap-0 py-0 transition-transform active:scale-[0.98]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Preview type={type} eager={eager} />
        </div>
        <CardHeader className="gap-0.5 px-3 py-2.5">
          <CardTitle className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{typeLabel(type.key)}</span>
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {type.count.toLocaleString("zh-CN")}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function HomeView({ manifest }: { manifest: Manifest }) {
  const recentItems = useRecentItems();

  const primaryTypes = manifest.types.filter((type) => type.primary);
  const dataTypes = manifest.types.filter((type) => !type.primary);
  const dataCount = dataTypes.reduce((sum, type) => sum + type.count, 0);

  return (
    <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 md:max-w-5xl md:px-8 md:pt-2">
      <header className="flex items-center gap-2.5 pt-5 md:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icon-192.png"
            alt=""
            width={36}
            height={36}
            priority
            className="size-9 rounded-lg"
          />
          <div className="flex flex-col leading-tight">
            <h1 className="text-base font-semibold tracking-tight">
              mai-finder
            </h1>
            <p className="text-xs text-muted-foreground">舞萌DX收藏品/静态资源wiki</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="关于"
            nativeButton={false}
            render={<Link href="/about" />}
          >
            <InfoIcon />
          </Button>
        </div>
      </header>

      <Link
        href="/search"
        className="mt-5 flex h-11 w-full items-center gap-2.5 rounded-full bg-muted px-4 text-sm text-muted-foreground transition-colors active:bg-muted/70"
      >
        <SearchIcon className="size-4" />
        <span>搜索名称、数据名或 ID</span>
        <Kbd className="ml-auto hidden md:inline-flex">/</Kbd>
      </Link>

      <p className="mt-2.5 px-1 text-xs text-muted-foreground">
        {manifest.total.toLocaleString("zh-CN")} 项资源，
        {manifest.imageCount.toLocaleString("zh-CN")} 项有图片，
        {manifest.types.length} 种类型
      </p>

      <section className="mt-6">
        <h2 className="mb-2.5 px-1 text-sm font-medium">资源分类</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {primaryTypes.map((type, index) => (
            <CategoryCard key={type.key} type={type} eager={index < 2} />
          ))}

          <Link
            href="/data"
            className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            <Card
              size="sm"
              className="h-full gap-0 py-0 transition-transform active:scale-[0.98]"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted/40">
                <DatabaseIcon className="size-6 text-muted-foreground" />
              </div>
              <CardHeader className="gap-0.5 px-3 py-2.5">
                <CardTitle className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">其他数据</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">
                    {dataCount.toLocaleString("zh-CN")}
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {recentItems.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2.5 px-1 text-sm font-medium">最近浏览</h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {recentItems.map((item) => (
              <Link
                key={itemKey(item)}
                href={`/browse/${item.type}#item=${encodeURIComponent(itemKey(item))}`}
                className="w-20 shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  {item.thumb ? (
                    <Image
                      src={item.thumb}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <ImageOffIcon className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                  )}
                </div>
                <p className="mt-1 truncate text-xs">{item.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
