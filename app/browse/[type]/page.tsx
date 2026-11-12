import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrowseView } from "@/components/browse-view";
import { JsonLd } from "@/components/json-ld";
import { BROWSE_PAGE_SIZE, typeLabel } from "@/lib/items";
import { readManifest, readTypeItems } from "@/lib/manifest.server";
import {
  breadcrumbList,
  pageMetadata,
  SITE_NAME,
  SITE_URL,
  typeDescription,
  typePageTitle,
} from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return readManifest().types.map((type) => ({ type: type.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const typeInfo = readManifest().types.find((entry) => entry.key === type);
  const label = typeLabel(type);

  if (!typeInfo) {
    return { title: label };
  }

  return pageMetadata({
    title: typePageTitle(label, typeInfo.primary),
    description: typeDescription({
      label,
      count: typeInfo.count,
      imageCount: typeInfo.imageCount,
      primary: typeInfo.primary,
    }),
    path: `/browse/${type}`,
  });
}

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const manifest = readManifest();
  const typeInfo = manifest.types.find((entry) => entry.key === type);

  if (!typeInfo) {
    notFound();
  }

  const items = readTypeItems(type);
  const label = typeLabel(type);
  const title = typePageTitle(label, typeInfo.primary);
  const description = typeDescription({
    label,
    count: typeInfo.count,
    imageCount: typeInfo.imageCount,
    primary: typeInfo.primary,
  });
  const url = `${SITE_URL}/browse/${type}`;
  const breadcrumbItems = typeInfo.primary
    ? [
        { name: "首页", path: "/" },
        { name: label, path: `/browse/${type}` },
      ]
    : [
        { name: "首页", path: "/" },
        { name: "其他 XML 数据", path: "/data" },
        { name: label, path: `/browse/${type}` },
      ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: `${title} — ${SITE_NAME}`,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "zh-CN",
        mainEntity: { "@id": `${url}#items` },
      },
      {
        "@type": "ItemList",
        "@id": `${url}#items`,
        name: `${label}列表`,
        numberOfItems: items.length,
        itemListElement: items.slice(0, 60).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
        })),
      },
      breadcrumbList(breadcrumbItems, `/browse/${type}`),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <BrowseView
        key={type}
        type={type}
        typeInfo={typeInfo}
        initialItems={items.slice(0, BROWSE_PAGE_SIZE)}
      />
    </>
  );
}
