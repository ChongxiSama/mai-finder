import type { Metadata } from "next";

import { DataBrowser } from "@/components/data-browser";
import { JsonLd } from "@/components/json-ld";
import { readManifest } from "@/lib/manifest.server";
import { breadcrumbList, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

const DATA_DESCRIPTION =
  "浏览舞萌 DX 的其他 XML 数据，收录地图、商店、任务、活动、称号等类型的游戏资源字段与解锁条件。";

export const metadata: Metadata = pageMetadata({
  title: "其他 XML 数据",
  description: DATA_DESCRIPTION,
  path: "/data",
});

export default function DataPage() {
  const manifest = readManifest();
  const dataTypes = manifest.types.filter((type) => !type.primary);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/data#webpage`,
        url: `${SITE_URL}/data`,
        name: `其他 XML 数据 — ${SITE_NAME}`,
        description: DATA_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "zh-CN",
        mainEntity: {
          "@type": "ItemList",
          "@id": `${SITE_URL}/data#types`,
          numberOfItems: dataTypes.length,
          itemListElement: dataTypes.map((type, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${type.key}（${type.count.toLocaleString("zh-CN")} 项）`,
            url: `${SITE_URL}/browse/${type.key}`,
          })),
        },
      },
      breadcrumbList(
        [
          { name: "首页", path: "/" },
          { name: "其他 XML 数据", path: "/data" },
        ],
        "/data",
      ),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <DataBrowser manifest={manifest} />
    </>
  );
}
