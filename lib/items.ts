export type ItemRecord = {
  type: string;
  id: number | null;
  name: string;
  dataName: string;
  xml: string;
  rarity: string | null;
  kindId: number | null;
  unlock: string | null;
  locked: boolean;
  image: string | null;
  thumb: string | null;
};

export type ManifestType = {
  key: string;
  count: number;
  imageCount: number;
  preview: string[];
  primary: boolean;
};

export type Manifest = {
  total: number;
  imageCount: number;
  textureCount: number;
  types: ManifestType[];
};

export type SearchEntry = {
  type: string;
  id: number | null;
  name: string;
  dataName: string;
  thumb: string | null;
  rarity: string | null;
  search: string;
};

export const RARITY_LABELS: Record<string, string> = {
  Normal: "普通",
  Bronze: "铜",
  Silver: "银",
  Gold: "金",
  Rainbow: "彩虹",
};

export function rarityLabel(rarity: string | null): string {
  if (rarity === null) {
    return "-";
  }
  return RARITY_LABELS[rarity] ?? rarity;
}

export const BROWSE_PAGE_SIZE = 60;

export const PRIMARY_ORDER = [
  "icon",
  "plate",
  "frame",
  "chara",
  "partner",
  "title",
  "photoFrame",
] as const;

export const TYPE_LABELS: Record<string, string> = {
  icon: "头像",
  plate: "姓名框",
  frame: "背景",
  chara: "旅行伙伴",
  partner: "搭档",
  title: "称号",
  photoFrame: "相片框",
};

const PRIMARY_TYPE_KEYS = new Set<string>(PRIMARY_ORDER);

export function typeLabel(type: string): string {
  return PRIMARY_TYPE_KEYS.has(type) ? (TYPE_LABELS[type] ?? type) : type;
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("zh-CN");
}

export function itemKey(item: { type: string; dataName: string }): string {
  return `${item.type}:${item.dataName}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

let manifestPromise: Promise<Manifest> | null = null;
const typeCache = new Map<string, Promise<ItemRecord[]>>();
let searchPromise: Promise<SearchEntry[]> | null = null;

export function fetchManifest(): Promise<Manifest> {
  if (manifestPromise === null) {
    manifestPromise = fetchJson<Manifest>("/data/manifest.json").catch(
      (error) => {
        manifestPromise = null;
        throw error;
      },
    );
  }
  return manifestPromise;
}

export function fetchTypeItems(type: string): Promise<ItemRecord[]> {
  const cached = typeCache.get(type);
  if (cached) {
    return cached;
  }

  const promise = fetchJson<ItemRecord[]>(
    `/data/types/${encodeURIComponent(type)}.json`,
  ).catch((error) => {
    typeCache.delete(type);
    throw error;
  });
  typeCache.set(type, promise);
  return promise;
}

export function prefetchSearchIndex(): void {
  void fetchSearchIndex().catch(() => {});
}

export function fetchSearchIndex(): Promise<SearchEntry[]> {
  if (searchPromise === null) {
    searchPromise = fetchJson<
      {
        type: string;
        id: number | null;
        name: string;
        dataName: string;
        thumb: string | null;
        rarity: string | null;
      }[]
    >("/data/search.json")
      .then((rows) =>
        rows.map(({ type, id, name, dataName, thumb, rarity }) => ({
          type,
          id,
          name,
          dataName,
          thumb,
          rarity,
          search: normalizeSearch(`${name} ${dataName} ${id ?? ""}`),
        })),
      )
      .catch((error) => {
        searchPromise = null;
        throw error;
      });
  }
  return searchPromise;
}
