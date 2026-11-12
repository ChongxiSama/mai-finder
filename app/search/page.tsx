import type { Metadata } from "next";

import { SearchScreen } from "@/components/search-screen";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "搜索",
    description:
      "按名称、数据名或 ID 搜索舞萌 DX 的头像、姓名框、背景、旅行伙伴、搭档、称号与其他 XML 数据。",
    path: "/search",
  }),
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return <SearchScreen />;
}
