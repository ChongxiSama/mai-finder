"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { toast } from "sonner";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileJsonIcon,
  ImageOffIcon,
  LinkIcon,
  LockIcon,
} from "lucide-react";

import { RarityBadge } from "@/components/rarity-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { itemKey, typeLabel, type ItemRecord } from "@/lib/items";
import { addRecentItem } from "@/lib/recent";
import { useMediaQuery } from "@/lib/use-media-query";

function CopyButton({ value, label }: { value: string; label: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(label);
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      onClick={copy}
    >
      <CopyIcon />
    </Button>
  );
}

function DetailImage({
  item,
  onPrev,
  onNext,
}: {
  item: ItemRecord;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) {
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        onNext();
      } else {
        onPrev();
      }
    }
  };

  if (!item.image || failed) {
    return (
      <div
        className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <ImageOffIcon className="size-4 shrink-0" />
        没有可用的图片
      </div>
    );
  }

  return (
    <div
      className="checkerboard relative aspect-square w-full overflow-hidden border-b bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="(max-width: 640px) 100vw, 384px"
        className={`object-contain p-4 transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      {!loaded ? (
        <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
          加载图片…
        </div>
      ) : null}
    </div>
  );
}

export function ItemDetailSheet({
  item,
  onClose,
  onPrev,
  onNext,
  canPrev,
  canNext,
  index,
  total,
}: {
  item: ItemRecord | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  index: number;
  total: number;
}) {
  const isMobile = useMediaQuery("(max-width: 639px)");
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (item !== null) {
      addRecentItem(item);
    }
  }, [item]);

  const copyLink = async () => {
    if (item === null) {
      return;
    }

    const link = `${window.location.origin}/browse/${item.type}#item=${encodeURIComponent(itemKey(item))}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("链接已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  const downloadJson = () => {
    if (item === null) {
      return;
    }

    const blob = new Blob([JSON.stringify(item, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.dataName}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("已开始下载 JSON");
  };

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        initialFocus={titleRef}
        className={
          isMobile
            ? "h-[88svh] gap-0 rounded-t-2xl p-0"
            : "w-full gap-0 p-0 sm:max-w-md"
        }
      >
        {item ? (
          <>
            <SheetHeader className="gap-1 border-b p-4 pr-12">
              <SheetTitle
                ref={titleRef}
                tabIndex={-1}
                className="truncate text-base outline-none"
              >
                {item.name}
              </SheetTitle>
              <SheetDescription>
                {typeLabel(item.type)} / {item.type}#{item.id ?? "-"}
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <DetailImage
                key={item.image ?? itemKey(item)}
                item={item}
                onPrev={onPrev}
                onNext={onNext}
              />

              <div className="flex flex-col gap-4 p-4">
                <dl className="grid grid-cols-[4.5rem_1fr] items-center gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">类型</dt>
                  <dd>{typeLabel(item.type)}</dd>
                  <dt className="text-muted-foreground">Kind</dt>
                  <dd className="font-mono text-xs">{item.type}</dd>
                  <dt className="text-muted-foreground">Kind ID</dt>
                  <dd className="font-mono text-xs">{item.kindId ?? "-"}</dd>
                  {item.unlock ? (
                    <>
                      <dt className="text-muted-foreground">解锁条件</dt>
                      <dd className="flex items-start gap-1.5">
                        {item.locked ? (
                          <LockIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        ) : null}
                        <span className="break-words">{item.unlock}</span>
                      </dd>
                    </>
                  ) : null}
                  {item.rarity ? (
                    <>
                      <dt className="text-muted-foreground">稀有度</dt>
                      <dd>
                        <RarityBadge rarity={item.rarity} />
                      </dd>
                    </>
                  ) : null}
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="flex min-w-0 items-center gap-1">
                    <span className="font-mono">{item.id ?? "-"}</span>
                    {item.id !== null ? (
                      <CopyButton
                        value={String(item.id)}
                        label="ID 已复制"
                      />
                    ) : null}
                  </dd>
                  <dt className="text-muted-foreground">数据名</dt>
                  <dd className="flex min-w-0 items-center gap-1">
                    <span className="font-mono break-all">{item.dataName}</span>
                    <CopyButton
                      value={item.dataName}
                      label="数据名已复制"
                    />
                  </dd>
                  <dt className="text-muted-foreground">XML</dt>
                  <dd className="font-mono text-xs break-all text-muted-foreground">
                    {item.xml}
                  </dd>
                </dl>

                <div className="grid grid-cols-2 gap-2">
                  {item.image ? (
                    <a
                      href={item.image}
                      download={`${item.dataName}.webp`}
                      className={buttonVariants()}
                      onClick={() => toast.success("已开始下载图片")}
                    >
                      <DownloadIcon data-icon="inline-start" />
                      下载图片
                    </a>
                  ) : null}
                  <Button variant="outline" onClick={downloadJson}>
                    <FileJsonIcon data-icon="inline-start" />
                    下载 JSON
                  </Button>
                  <Button variant="outline" onClick={copyLink}>
                    <LinkIcon data-icon="inline-start" />
                    复制链接
                  </Button>
                  {item.image ? (
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <ExternalLinkIcon data-icon="inline-start" />
                      查看原图
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t p-3">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="上一项"
                  disabled={!canPrev}
                  onClick={onPrev}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="下一项"
                  disabled={!canNext}
                  onClick={onNext}
                >
                  <ChevronRightIcon />
                </Button>
                <span className="ml-1 text-xs text-muted-foreground">
                  {index >= 0 ? index + 1 : 0} / {total}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                关闭
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
