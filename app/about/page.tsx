import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ExternalLinkIcon, InfoIcon } from "lucide-react";

import { GithubMark } from "@/components/github-mark";
import { JsonLd } from "@/components/json-ld";
import { ThemeSetting } from "@/components/theme-setting";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { readManifest } from "@/lib/manifest.server";
import { breadcrumbList, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

const ABOUT_DESCRIPTION =
  "mai-finder 是收录舞萌 DX 收藏品、静态资源与 XML 数据的非官方查询 wiki，由 Chongxi 与 CEPATO 开发维护。";

export const metadata: Metadata = pageMetadata({
  title: "关于",
  description: ABOUT_DESCRIPTION,
  path: "/about",
});

const shortcuts = [
  { keys: ["⌘", "K"], label: "打开搜索" },
  { keys: ["/"], label: "打开搜索" },
  { keys: ["←", "→"], label: "详情中切换上一项 / 下一项" },
  { keys: ["Esc"], label: "清空搜索或关闭详情" },
];

export default function AboutPage() {
  const manifest = readManifest();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${SITE_URL}/about#webpage`,
        url: `${SITE_URL}/about`,
        name: `关于 — ${SITE_NAME}`,
        description: ABOUT_DESCRIPTION,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        inLanguage: "zh-CN",
        about: { "@id": "https://chongxi.us/#person" },
      },
      breadcrumbList(
        [
          { name: "首页", path: "/" },
          { name: "关于", path: "/about" },
        ],
        "/about",
      ),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[560px] items-center gap-1 px-2 md:max-w-3xl md:px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="返回"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ChevronLeftIcon />
          </Button>
          <h1 className="px-1 text-base font-semibold">关于</h1>
          <InfoIcon className="ml-auto size-4 text-muted-foreground" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 md:max-w-3xl md:px-8">
        <section className="flex items-center gap-3 py-5">
          <Image
            src="/icon-192.png"
            alt=""
            width={48}
            height={48}
            priority
            className="size-12 rounded-xl"
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold tracking-tight">mai-finder</p>
            <p className="text-xs text-muted-foreground">
              舞萌DX收藏品/静态资源wiki · v26.0
            </p>
          </div>
        </section>

        <p className="-mt-2 pb-4 text-sm leading-relaxed text-muted-foreground">
          收录舞萌DX收藏品、静态资源与 XML 数据的非官方查询 wiki。
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border px-3 py-3">
            <p className="text-xl font-semibold">
              {manifest.total.toLocaleString("zh-CN")}
            </p>
            <p className="text-xs text-muted-foreground">资源条目</p>
          </div>
          <div className="rounded-xl border px-3 py-3">
            <p className="text-xl font-semibold">
              {manifest.imageCount.toLocaleString("zh-CN")}
            </p>
            <p className="text-xs text-muted-foreground">有图片</p>
          </div>
          <div className="rounded-xl border px-3 py-3">
            <p className="text-xl font-semibold">
              {manifest.types.length.toLocaleString("zh-CN")}
            </p>
            <p className="text-xs text-muted-foreground">XML 类型</p>
          </div>
        </div>

        <section className="mt-4 flex flex-col gap-2">
          <h2 className="text-sm font-medium">项目</h2>
          <a
            href="https://github.com/ChongxiSama/mai-finder"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors hover:bg-muted/40 active:bg-muted/60"
          >
            <GithubMark className="size-4" />
            <span className="flex-1">ChongxiSama/mai-finder</span>
            <ExternalLinkIcon className="size-4 text-muted-foreground" />
          </a>
          <p className="px-1 text-xs text-muted-foreground">本站点源码</p>
        </section>

        <section className="mt-6 flex flex-col gap-2">
          <h2 className="text-sm font-medium">数据范围</h2>
          <div className="rounded-xl border p-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              数据取自游戏资源 XML 与 Texture2D，共 {manifest.types.length}{" "}
              种类型、{manifest.total.toLocaleString("zh-CN")}{" "}
              条记录，不含乐曲曲目本体。
            </p>
            <p className="mt-2">
              称号与搭档的稀有度来自 XML 的 rareType
              字段，分为普通、铜、银、金、彩虹。
            </p>
            <p className="mt-2">
              Kind ID 对应游戏的 itemKind：姓名框 1、称号 2、头像 3、礼物
              4、乐曲 5、 旅行伙伴 9、搭档 10、背景 11、券 12。
            </p>
            <p className="mt-2">
              解锁条件取自 XML 的 normText 与 dispCond 字段，显示在条目详情中。
            </p>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-2">
          <h2 className="text-sm font-medium">关于</h2>
          <div className="rounded-xl border p-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              制作本站初衷其实只是方便我自己查询，我觉得查这些确实挺实用的干脆public了。
            </p>
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-2">
          <h2 className="text-sm font-medium">快捷操作</h2>
          <div className="overflow-hidden rounded-xl border">
            {shortcuts.map((item) => (
              <div
                key={`${item.label}-${item.keys.join("")}`}
                className="flex items-center justify-between gap-3 border-b px-3 py-2.5 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {item.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-2">
          <h2 className="text-sm font-medium">外观</h2>
          <div className="rounded-xl border p-3">
            <ThemeSetting />
          </div>
        </section>

        <section className="mt-5 flex flex-col gap-2">
          <h2 className="text-sm font-medium">免责声明</h2>
          <div className="rounded-xl border p-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              非官方项目，与
              SEGA、华立无关。资源版权归原作者所有，本站仅提供查询与预览。
            </p>
          </div>
        </section>

        <p className="py-6 text-center text-xs text-muted-foreground">
          mai-finder v26.0 · 由 Chongxi & CEPATO 开发维护
        </p>
      </main>
    </>
  );
}
