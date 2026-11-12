"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import { ImageOffIcon } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { RarityBadge } from "@/components/rarity-badge";
import { typeLabel, type ItemRecord } from "@/lib/items";

const GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";
const THUMB_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw";

type GridAspect = "square" | "wide";

export function ItemThumb({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  className: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <ImageOffIcon className="absolute inset-0 m-auto size-5 text-muted-foreground" />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}

function GridCard({
  item,
  onSelect,
  aspect,
}: {
  item: ItemRecord;
  onSelect: (item: ItemRecord) => void;
  aspect: GridAspect;
}) {
  const select = () => onSelect(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      }}
      aria-label={`查看 ${item.name}`}
      className="cursor-pointer rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
    >
      <Card
        size="sm"
        className="h-full gap-0 py-0 transition-shadow hover:ring-foreground/25"
      >
        <div
          className={`relative w-full overflow-hidden bg-muted ${
            aspect === "wide" ? "aspect-[16/5]" : "aspect-square"
          }`}
        >
          <ItemThumb
            src={item.thumb}
            alt={`${item.name}（${typeLabel(item.type)}）`}
            sizes={THUMB_SIZES}
            className={aspect === "wide" ? "object-contain p-2" : "object-contain p-3"}
          />
          {item.rarity ? (
            <div className="absolute top-2 right-2">
              <RarityBadge rarity={item.rarity} />
            </div>
          ) : null}
        </div>
        <CardHeader className="gap-1 px-3 py-3">
          <CardTitle className="truncate text-sm">{item.name}</CardTitle>
          <CardDescription className="flex items-center justify-between gap-2">
            <span className="truncate">{typeLabel(item.type)}</span>
            <span className="font-mono text-xs">
              #{item.id ?? "-"}
            </span>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function ListRow({
  item,
  onSelect,
}: {
  item: ItemRecord;
  onSelect: (item: ItemRecord) => void;
}) {
  const select = () => onSelect(item);

  return (
    <Item
      render={
        <div
          role="button"
          tabIndex={0}
          onClick={select}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              select();
            }
          }}
          aria-label={`查看 ${item.name}`}
          className="w-full cursor-pointer text-left"
        />
      }
      size="sm"
      className="rounded-none border-0 hover:bg-muted/60"
    >
      <ItemMedia>
        <div className="relative size-10 overflow-hidden rounded-md bg-muted">
          <ItemThumb
            src={item.thumb}
            alt=""
            sizes="40px"
            className="object-contain p-0.5"
          />
        </div>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full truncate">{item.name}</ItemTitle>
        <ItemDescription className="truncate">
          {typeLabel(item.type)} / {item.dataName}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <RarityBadge rarity={item.rarity} />
        <span className="font-mono text-xs text-muted-foreground">
          #{item.id ?? "-"}
        </span>
      </ItemActions>
    </Item>
  );
}

export function ItemGrid({
  items,
  onSelect,
  aspect = "square",
}: {
  items: ItemRecord[];
  onSelect: (item: ItemRecord) => void;
  aspect?: GridAspect;
}) {
  return (
    <div className={GRID_CLASS}>
      {items.map((item) => (
        <div key={`${item.type}:${item.dataName}`}>
          <GridCard item={item} onSelect={onSelect} aspect={aspect} />
        </div>
      ))}
    </div>
  );
}

export function ItemList({
  items,
  onSelect,
}: {
  items: ItemRecord[];
  onSelect: (item: ItemRecord) => void;
}) {
  return (
    <ItemGroup className="gap-0 overflow-hidden rounded-xl border">
      {items.map((item, index) => (
        <Fragment key={`${item.type}:${item.dataName}`}>
          <ListRow item={item} onSelect={onSelect} />
          {index < items.length - 1 ? (
            <ItemSeparator className="my-0" />
          ) : null}
        </Fragment>
      ))}
    </ItemGroup>
  );
}

export function GridSkeleton({ aspect = "square" }: { aspect?: GridAspect }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton
          key={index}
          className={`rounded-xl ${
            aspect === "wide" ? "aspect-[16/7]" : "aspect-[3/4]"
          }`}
        />
      ))}
    </div>
  );
}
