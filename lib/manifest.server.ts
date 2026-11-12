import { readFileSync } from "node:fs";
import path from "node:path";

import type { ItemRecord, Manifest } from "@/lib/items";

export function readManifest(): Manifest {
  const file = path.join(process.cwd(), "public", "data", "manifest.json");
  return JSON.parse(readFileSync(file, "utf8")) as Manifest;
}

export function readTypeItems(type: string): ItemRecord[] {
  const file = path.join(
    process.cwd(),
    "public",
    "data",
    "types",
    `${type}.json`,
  );
  return JSON.parse(readFileSync(file, "utf8")) as ItemRecord[];
}
