"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { ItemDetailSheet } from "@/components/item-detail-sheet";
import { ItemGrid, ItemList } from "@/components/item-views";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useItemDetail } from "@/lib/item-detail";
import {
  BROWSE_PAGE_SIZE,
  fetchTypeItems,
  normalizeSearch,
  PRIMARY_ORDER,
  typeLabel,
  type ItemRecord,
  type ManifestType,
} from "@/lib/items";

const PAGE_SIZE = BROWSE_PAGE_SIZE;

const SORT_ITEMS: { value: string; label: string }[] = [
  { value: "default", label: "默认" },
  { value: "id-asc", label: "ID 升序" },
  { value: "id-desc", label: "ID 降序" },
  { value: "name", label: "名称" },
];

const SORT_VALUES = new Set(SORT_ITEMS.map((option) => option.value));
const ACTIVE_TOGGLE =
  "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground";

type SortKey = "default" | "id-asc" | "id-desc" | "name";

function toBrowserItem(item: ItemRecord): BrowserItem {
  return {
    ...item,
    search: normalizeSearch(`${item.name} ${item.dataName} ${item.id ?? ""}`),
  };
}

type ViewMode = "grid" | "list";
type BrowserItem = ItemRecord & { search: string };

function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && SORT_VALUES.has(value);
}

function FilterSheet({
  open,
  onOpenChange,
  sort,
  setSort,
  view,
  setView,
  onlyImages,
  setOnlyImages,
  showImages,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: SortKey;
  setSort: (sort: SortKey) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  onlyImages: boolean;
  setOnlyImages: (value: boolean) => void;
  showImages: boolean;
  onReset: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85svh] gap-0 overflow-y-auto rounded-t-2xl p-0"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle>筛选与排序</SheetTitle>
          <SheetDescription>调整当前分类的显示方式</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">排序</p>
            <ToggleGroup
              aria-label="排序方式"
              variant="outline"
              size="sm"
              value={[sort]}
              onValueChange={(values) => {
                const next = values[0];
                if (isSortKey(next)) {
                  setSort(next);
                }
              }}
              className="flex-wrap"
            >
              {SORT_ITEMS.map((option) => (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  className={ACTIVE_TOGGLE}
                >
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">视图</p>
            <ToggleGroup
              aria-label="视图方式"
              variant="outline"
              size="sm"
              value={[view]}
              onValueChange={(values) => {
                const next = values[0];
                if (next === "grid" || next === "list") {
                  setView(next);
                }
              }}
            >
              <ToggleGroupItem value="grid" className={ACTIVE_TOGGLE}>
                <LayoutGridIcon />
                网格
              </ToggleGroupItem>
              <ToggleGroupItem value="list" className={ACTIVE_TOGGLE}>
                <ListIcon />
                列表
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {showImages ? (
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="only-images" className="text-sm font-medium">
                只看有图片
              </label>
              <Switch
                id="only-images"
                checked={onlyImages}
                onCheckedChange={setOnlyImages}
              />
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 border-t p-4">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            重置
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TypeTabs({ activeType }: { activeType: string }) {
  const dataActive = !PRIMARY_ORDER.some((type) => type === activeType);

  return (
    <nav
      aria-label="资源分类"
      className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0"
    >
      {PRIMARY_ORDER.map((type) => (
        <Link
          key={type}
          href={`/browse/${type}`}
          aria-current={activeType === type ? "page" : undefined}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
            activeType === type
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground active:bg-muted/70"
          }`}
        >
          {typeLabel(type)}
        </Link>
      ))}
      <Link
        href="/data"
        aria-current={dataActive ? "page" : undefined}
        className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
          dataActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground active:bg-muted/70"
        }`}
      >
        其他数据
      </Link>
    </nav>
  );
}

export function BrowseView({
  type,
  typeInfo,
  initialItems,
}: {
  type: string;
  typeInfo: ManifestType;
  initialItems: ItemRecord[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<BrowserItem[]>(() =>
    initialItems.map(toBrowserItem),
  );
  const [fullLoaded, setFullLoaded] = useState(
    initialItems.length >= typeInfo.count,
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sort, setSort] = useState<SortKey>("default");
  const [onlyImages, setOnlyImages] = useState(false);
  const [view, setView] = useState<ViewMode>(
    typeInfo.imageCount > 0 ? "grid" : "list",
  );
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fullLoaded) {
      return;
    }

    let active = true;

    fetchTypeItems(type)
      .then((data) => {
        if (!active) {
          return;
        }
        setItems(data.map(toBrowserItem));
        setFullLoaded(true);
        setLoadFailed(false);
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [type, fullLoaded, reloadKey]);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-app-scroll]");
    if (!scroller) {
      return;
    }

    const handleScroll = () => {
      setShowTop(scroller.scrollTop > 800);
    };
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  const filtered = useMemo(() => {
    const result = items.filter((item) => !onlyImages || item.image !== null);

    switch (sort) {
      case "id-asc":
        return [...result].sort((a, b) => (a.id ?? -1) - (b.id ?? -1));
      case "id-desc":
        return [...result].sort((a, b) => (b.id ?? -1) - (a.id ?? -1));
      case "name":
        return [...result].sort((a, b) =>
          a.name.localeCompare(b.name, "zh-CN"),
        );
      default:
        return result;
    }
  }, [items, sort, onlyImages]);

  const visibleItems = filtered.slice(0, limit);
  const remaining = fullLoaded ? filtered.length - visibleItems.length : 0;
  const totalCount = fullLoaded ? items.length : typeInfo.count;
  const detail = useItemDetail(items, filtered);

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

  const resetFilters = () => {
    setSort("default");
    setOnlyImages(false);
    setLimit(PAGE_SIZE);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const filtersActive = onlyImages || sort !== "default";
  const wideGrid = type === "plate" || type === "frame";

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
              {typeInfo.primary
                ? typeLabel(type)
                : `${typeLabel(type)} XML 数据`}
            </h1>
            <p className="text-[11px] text-muted-foreground">
              {typeInfo.count.toLocaleString("zh-CN")} 项
              {typeInfo.imageCount > 0
                ? ` · ${typeInfo.imageCount.toLocaleString("zh-CN")} 有图`
                : ""}
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="筛选"
            className="relative"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontalIcon />
            {filtersActive ? (
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-2 md:max-w-5xl md:px-8">
        <TypeTabs activeType={type} />

        <div className="flex items-center justify-between gap-2 py-2 text-xs text-muted-foreground">
          <p>
            {filtered.length === items.length
              ? `共 ${totalCount.toLocaleString("zh-CN")} 项`
              : `筛选出 ${filtered.length.toLocaleString("zh-CN")} 项${
                  fullLoaded ? "" : "（加载中）"
                }`}
          </p>
          {filtersActive ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-foreground"
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
              <EmptyTitle>当前筛选下没有资源</EmptyTitle>
              <EmptyDescription>调整筛选条件再试。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={resetFilters}>
                重置筛选
              </Button>
            </EmptyContent>
          </Empty>
        ) : view === "grid" ? (
          <ItemGrid
            items={visibleItems}
            onSelect={detail.openItem}
            aspect={wideGrid ? "wide" : "square"}
          />
        ) : (
          <ItemList items={visibleItems} onSelect={detail.openItem} />
        )}

        {!fullLoaded ? (
          loadFailed ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <p className="text-xs text-muted-foreground">
                其余资源加载失败。
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                重试
              </Button>
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              正在加载全部资源…
            </p>
          )
        ) : remaining > 0 ? (
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
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            已加载全部
          </p>
        )}
      </main>

      {showTop ? (
        <Button
          type="button"
          size="icon"
          className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 rounded-full shadow-lg"
          aria-label="回到顶部"
          onClick={() =>
            document
              .querySelector<HTMLElement>("[data-app-scroll]")
              ?.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <ArrowUpIcon />
        </Button>
      ) : null}

      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        sort={sort}
        setSort={(value) => {
          setSort(value);
          setLimit(PAGE_SIZE);
        }}
        view={view}
        setView={setView}
        onlyImages={onlyImages}
        setOnlyImages={(value) => {
          setOnlyImages(value);
          setLimit(PAGE_SIZE);
        }}
        showImages={typeInfo.imageCount > 0}
        onReset={resetFilters}
      />

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
