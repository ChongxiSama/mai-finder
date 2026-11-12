"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  SearchIcon,
  SearchXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { ItemList } from "@/components/item-views";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useItemDetail } from "@/lib/item-detail";
import {
  fetchTypeItems,
  normalizeSearch,
  typeLabel,
  type ItemRecord,
  type Manifest,
  type ManifestType,
} from "@/lib/items";

const PAGE_SIZE = 100;

type BrowserItem = ItemRecord & { search: string };

function DataItems({ typeInfo }: { typeInfo: ManifestType }) {
  const [items, setItems] = useState<BrowserItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetchTypeItems(typeInfo.key)
      .then((data) => {
        if (!active) {
          return;
        }
        setItems(
          data.map((item) => ({
            ...item,
            search: normalizeSearch(
              `${item.name} ${item.dataName} ${item.id ?? ""}`,
            ),
          })),
        );
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [typeInfo.key, reloadKey]);

  const filtered = useMemo(() => {
    if (!items) {
      return [];
    }

    const normalized = normalizeSearch(query.trim());
    const tokens = normalized.split(/\s+/).filter(Boolean);

    return items.filter((item) =>
      tokens.every((token) => item.search.includes(token)),
    );
  }, [items, query]);

  const visibleItems = filtered.slice(0, limit);
  const remaining = filtered.length - visibleItems.length;
  const detail = useItemDetail(items ?? [], filtered);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || remaining <= 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => Math.min(current + PAGE_SIZE, filtered.length));
        }
      },
      {
        root: document.querySelector<HTMLElement>("[data-app-scroll]"),
        rootMargin: "700px 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [remaining, limit, filtered.length]);

  return (
    <>
      <div className="py-2">
        <InputGroup className="h-9 rounded-full border-transparent bg-muted">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(PAGE_SIZE);
            }}
            placeholder={`搜索 ${typeLabel(typeInfo.key)}`}
            aria-label={`搜索 ${typeLabel(typeInfo.key)}`}
            autoComplete="off"
            className="h-full"
          />
          {query.length > 0 ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label="清空搜索"
                onClick={() => {
                  setQuery("");
                  setLimit(PAGE_SIZE);
                }}
              >
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      </div>

      {failed ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>数据加载失败</EmptyTitle>
            <EmptyDescription>
              无法读取这个类型的数据，请稍后重试。
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => {
                setFailed(false);
                setItems(null);
                setReloadKey((key) => key + 1);
              }}
            >
              重试
            </Button>
          </EmptyContent>
        </Empty>
      ) : items === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 pb-2 text-xs text-muted-foreground">
            <p>
              {filtered.length === items.length
                ? `共 ${items.length.toLocaleString("zh-CN")} 项`
                : `筛选出 ${filtered.length.toLocaleString("zh-CN")} 项`}
            </p>
            {query.length > 0 ? (
              <button
                type="button"
                className="text-foreground"
                onClick={() => {
                  setQuery("");
                  setLimit(PAGE_SIZE);
                }}
              >
                清除
              </button>
            ) : null}
          </div>

          {visibleItems.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>没有找到匹配的数据</EmptyTitle>
                <EmptyDescription>换个关键词再试。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemList items={visibleItems} onSelect={detail.openItem} />
          )}

          {remaining > 0 ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setLimit((current) =>
                    Math.min(current + PAGE_SIZE, filtered.length),
                  )
                }
              >
                加载更多（剩余 {remaining.toLocaleString("zh-CN")}）
              </Button>
              <div ref={sentinelRef} className="h-px w-full" />
            </div>
          ) : null}
        </>
      )}

      <ItemDetailSheet
        item={detail.selected}
        onClose={detail.closeItem}
        onPrev={detail.goPrev}
        onNext={detail.goNext}
        canPrev={detail.canPrev}
        canNext={detail.canNext}
        index={detail.index}
        total={detail.total}
      />
    </>
  );
}

function TypePicker({
  types,
  selected,
  onSelect,
}: {
  types: ManifestType[];
  selected: string;
  onSelect: (type: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = types.find((type) => type.key === selected);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left active:bg-muted/60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">
            {current ? typeLabel(current.key) : "选择类型"}
          </span>
          {current ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {current.count.toLocaleString("zh-CN")} 项
            </span>
          ) : null}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80svh] gap-0 rounded-t-2xl p-0"
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle>选择数据类型</SheetTitle>
            <SheetDescription>
              共 {types.length} 种 XML 数据类型
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto p-2">
            {types.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  onSelect(type.key);
                  setOpen(false);
                }}
                aria-pressed={selected === type.key}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left ${
                  selected === type.key
                    ? "bg-secondary text-secondary-foreground"
                    : "active:bg-muted/60"
                }`}
              >
                <span className="truncate text-sm">{typeLabel(type.key)}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {type.count.toLocaleString("zh-CN")}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function DataBrowser({ manifest }: { manifest: Manifest }) {
  const router = useRouter();
  const dataTypes = manifest.types.filter((type) => !type.primary);
  const [selected, setSelected] = useState(dataTypes[0]?.key ?? "");
  const typeInfo = dataTypes.find((type) => type.key === selected) ?? null;

  const total = dataTypes.reduce((sum, type) => sum + type.count, 0);

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[560px] items-center gap-1 px-2 md:max-w-5xl md:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="返回"
            onClick={goBack}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate text-base leading-tight font-semibold">
              其他 XML 数据
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {total.toLocaleString("zh-CN")} 项 · {dataTypes.length} 种类型
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="搜索"
            nativeButton={false}
            render={<Link href="/search" />}
          >
            <SearchIcon />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 md:max-w-5xl md:px-8">
        {typeInfo ? (
          <>
            <div className="py-3">
              <TypePicker
                types={dataTypes}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
            <DataItems key={typeInfo.key} typeInfo={typeInfo} />
          </>
        ) : (
          <Empty className="mt-6 border border-dashed">
            <EmptyHeader>
              <EmptyTitle>没有其他数据</EmptyTitle>
              <EmptyDescription>当前数据集里只有可视化资源。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {dataTypes.length > 0 ? (
          <nav aria-label="全部 XML 类型" className="mt-6 border-t pt-4">
            <h2 className="mb-2 text-xs font-medium text-muted-foreground">
              全部 XML 类型
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {dataTypes.map((type) => (
                <li key={type.key}>
                  <Link
                    href={`/browse/${type.key}`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    <span>{type.key}</span>
                    <span className="font-mono text-[10px]">
                      {type.count.toLocaleString("zh-CN")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </main>
    </>
  );
}
