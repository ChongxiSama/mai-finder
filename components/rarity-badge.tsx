import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { rarityLabel } from "@/lib/items";

const STYLES: Record<string, string> = {
  Normal: "border-border/70 text-muted-foreground",
  Bronze:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300",
  Silver:
    "border-zinc-400/50 bg-zinc-400/10 text-zinc-600 dark:border-zinc-500/50 dark:bg-zinc-400/10 dark:text-zinc-300",
  Gold:
    "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:border-yellow-400/50 dark:bg-yellow-400/10 dark:text-yellow-300",
  Rainbow:
    "border-transparent bg-[linear-gradient(100deg,#ff7eb3,#feca57,#48dbfb,#a29bfe)] text-white",
};

export function RarityBadge({
  rarity,
  className,
}: {
  rarity: string | null;
  className?: string;
}) {
  if (rarity === null) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 shrink-0 px-1.5 text-[11px] font-medium",
        STYLES[rarity] ?? "",
        className,
      )}
    >
      {rarityLabel(rarity)}
    </Badge>
  );
}
