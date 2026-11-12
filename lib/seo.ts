import type { Metadata } from "next";

export const SITE_URL = "https://mai-find.chongxi.us";
export const SITE_NAME = "mai-finder";
export const SITE_TITLE = "mai-finder — 舞萌DX收藏品/静态资源wiki";
export const SITE_DESCRIPTION =
  "按名称、数据名或 ID 查询舞萌 DX 的头像、姓名框、背景、旅行伙伴、搭档、称号与 XML 资料。";
export const OG_IMAGE_ALT = "mai-finder — 舞萌DX收藏品与静态资源查询";

export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: OG_IMAGE_ALT,
} as const;

export const KEYWORDS = [
  "舞萌DX",
  "maimai",
  "mai-finder",
  "舞萌DX头像",
  "舞萌DX姓名框",
  "舞萌DX背景",
  "旅行伙伴",
  "搭档",
  "称号",
  "收藏品",
  "XML 数据",
  "wiki",
];

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: path,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
  };
}

export function typePageTitle(label: string, primary: boolean): string {
  return primary ? label : `${label} XML 数据`;
}

export function typeDescription({
  label,
  count,
  imageCount,
  primary,
}: {
  label: string;
  count: number;
  imageCount: number;
  primary: boolean;
}): string {
  const total = count.toLocaleString("zh-CN");

  if (primary) {
    const images =
      imageCount > 0
        ? `，其中 ${imageCount.toLocaleString("zh-CN")} 项含预览图片`
        : "";
    return `舞萌 DX ${label}合集，共 ${total} 项${images}。支持按名称、数据名或 ID 查询与预览。`;
  }

  return `${label} 类型 XML 数据共 ${total} 条，收录舞萌 DX 游戏资源字段与解锁条件，可按名称、数据名或 ID 查询。`;
}

export function breadcrumbList(
  items: { name: string; path: string }[],
  idPath: string,
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${idPath}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
