import type { Metadata } from "next";

import { HomeView } from "@/components/home-view";
import { JsonLd } from "@/components/json-ld";
import { typeLabel } from "@/lib/items";
import { readManifest } from "@/lib/manifest.server";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

export default function Home() {
  const manifest = readManifest();
  const primaryTypes = manifest.types.filter((type) => type.primary);
  const dataCount = manifest.types
    .filter((type) => !type.primary)
    .reduce((sum, type) => sum + type.count, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "zh-CN",
        mainEntity: {
          "@type": "ItemList",
          "@id": `${SITE_URL}/#categories`,
          numberOfItems: primaryTypes.length + 1,
          itemListElement: [
            ...primaryTypes.map((type, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: `${typeLabel(type.key)}（${type.count.toLocaleString("zh-CN")} 项）`,
              url: `${SITE_URL}/browse/${type.key}`,
            })),
            {
              "@type": "ListItem",
              position: primaryTypes.length + 1,
              name: `其他 XML 数据（${dataCount.toLocaleString("zh-CN")} 项）`,
              url: `${SITE_URL}/data`,
            },
          ],
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomeView manifest={manifest} />
    </>
  );
}
