"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DatabaseIcon,
  HistoryIcon,
  ImageOffIcon,
  SearchIcon,
  SearchXIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";

import { ItemThumb } from "@/components/item-views";
import { RarityBadge } from "@/components/rarity-badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchSearchIndex,
  itemKey,
  normalizeSearch,
  PRIMARY_ORDER,
  typeLabel,
  type SearchEntry,
} from "@/lib/items";
import {
  addRecentSearch,
  useRecentItems,
  useRecentSearches,
} from "@/lib/recent";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return <>{text}</>;
  }

  const matcher = new RegExp(
    `(${tokens.map(escapeRegExp).join("|")})`,
    "gi",
  );
  const lowered = new Set(
    tokens.map((token) => token.toLocaleLowerCase("zh-CN")),
  );

  return (
    <>
      {text.split(matcher).map((part, index) =>
        lowered.has(part.toLocaleLowerCase("zh-CN")) ? (
          <span key={index} className="font-semibold text-foreground">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

const COLLATOR = new Intl.Collator("zh-CN");
const normCache = new WeakMap<SearchEntry, { name: string; dataName: string }>();

function normOf(entry: SearchEntry): { name: string; dataName: string } {
  let value = normCache.get(entry);
  if (value === undefined) {
    value = {
      name: normalizeSearch(entry.name),
      dataName: normalizeSearch(entry.dataName),
    };
    normCache.set(entry, value);
  }
  return value;
}

function rankEntry(entry: SearchEntry, normalized: string): number {
  const { name, dataName } = normOf(entry);

  if (name === normalized) {
    return 0;
  }
  if (name.startsWith(normalized)) {
    return 1;
  }
  if (name.includes(normalized)) {
    return 2;
  }
  if (dataName === normalized) {
    return 3;
  }
  if (dataName.includes(normalized)) {
    return 4;
  }
  return 5;
}

export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const recentSearches = useRecentSearches();
  const recentItems = useRecentItems();
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let active = true;

    fetchSearchIndex()
      .then((data) => {
        if (active) {
          setEntries(data);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (query.length > 0) {
          setQuery("");
          inputRef.current?.focus();
        } else if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }

      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const target = event.target instanceof HTMLElement ? event.target : null;
        if (!target?.closest("input, textarea, [contenteditable='true']")) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [query, router]);

  const normalized = normalizeSearch(deferredQuery.trim());

  const matches = useMemo(() => {
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (!entries || tokens.length === 0) {
      return [];
    }

    return entries
      .filter((entry) => tokens.every((token) => entry.search.includes(token)))
      .map((entry) => ({ entry, rank: rankEntry(entry, normalized) }))
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          a.entry.name.length - b.entry.name.length ||
          COLLATOR.compare(a.entry.name, b.entry.name),
      )
      .map(({ entry }) => entry);
  }, [entries, normalized]);

  const results = matches.slice(0, 80);
  const searching = normalized.length > 0;

  const openEntry = (entry: SearchEntry) => {
    if (query.trim().length > 0) {
      addRecentSearch(query);
    }
    router.push(
      `/browse/${entry.type}#item=${encodeURIComponent(itemKey(entry))}`,
    );
  };

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
        <div className="mx-auto flex h-14 w-full max-w-[560px] items-center gap-1 px-2 md:max-w-3xl md:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="返回"
            onClick={goBack}
          >
            <ChevronLeftIcon />
          </Button>
          <InputGroup className="h-10 flex-1 rounded-full border-transparent bg-muted">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索名称、数据名或 ID"
              aria-label="搜索资源"
              autoComplete="off"
              autoFocus
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
                    inputRef.current?.focus();
                  }}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 py-4 md:max-w-3xl md:px-8">
        {!searching ? (
          <div className="flex flex-col gap-6">
            {recentSearches.length > 0 ? (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <HistoryIcon className="size-3.5" />
                  最近搜索
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors active:bg-muted/70"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {recentItems.length > 0 ? (
              <section>
                <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                  最近浏览
                </h2>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {recentItems.map((item) => (
                    <button
                      key={itemKey(item)}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/browse/${item.type}#item=${encodeURIComponent(itemKey(item))}`,
                        )
                      }
                      className="w-20 shrink-0 text-left"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                        {item.thumb ? (
                          <ItemThumb
                            src={item.thumb}
                            alt=""
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <ImageOffIcon className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs">{item.name}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="mb-1 text-xs font-medium text-muted-foreground">
                浏览分类
              </h2>
              <div className="overflow-hidden rounded-xl border">
                {PRIMARY_ORDER.map((type) => (
                  <Link
                    key={type}
                    href={`/browse/${type}`}
                    className="flex items-center justify-between border-b px-3 py-3 text-sm last:border-b-0 active:bg-muted/60"
                  >
                    <span>{typeLabel(type)}</span>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </Link>
                ))}
                <Link
                  href="/data"
                  className="flex items-center justify-between px-3 py-3 text-sm active:bg-muted/60"
                >
                  <span className="flex items-center gap-2">
                    <DatabaseIcon className="size-4 text-muted-foreground" />
                    其他 XML 数据
                  </span>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Link>
              </div>
            </section>
          </div>
        ) : failed ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlertIcon />
              </EmptyMedia>
              <EmptyTitle>搜索索引加载失败</EmptyTitle>
              <EmptyDescription>请检查网络后重试。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => {
                  setFailed(false);
                  setEntries(null);
                  setReloadKey((key) => key + 1);
                }}
              >
                重试
              </Button>
            </EmptyContent>
          </Empty>
        ) : entries === null ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchXIcon />
              </EmptyMedia>
              <EmptyTitle>没有找到匹配的资源</EmptyTitle>
              <EmptyDescription>换个关键词再试。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            <p className="mb-1 px-1 text-xs text-muted-foreground">
              {matches.length.toLocaleString("zh-CN")} 个结果
              {matches.length > results.length
                ? `，显示前 ${results.length} 个`
                : ""}
            </p>
            <div className="overflow-hidden rounded-xl border">
              {results.map((entry) => (
                <div
                  key={`${entry.type}:${entry.dataName}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEntry(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openEntry(entry);
                    }
                  }}
                  aria-label={`打开 ${entry.name}`}
                  className="flex cursor-pointer items-center gap-3 border-b px-3 py-2.5 last:border-b-0 active:bg-muted/60"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    <ItemThumb
                      src={entry.thumb}
                      alt=""
                      sizes="40px"
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <Highlight text={entry.name} query={query} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {typeLabel(entry.type)} / {entry.dataName}
                      {entry.id !== null ? ` / #${entry.id}` : ""}
                    </p>
                  </div>
                  <RarityBadge rarity={entry.rarity} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
