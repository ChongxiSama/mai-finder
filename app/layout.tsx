import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/app-shell";
import { JsonLd } from "@/components/json-ld";
import { readManifest } from "@/lib/manifest.server";
import {
  KEYWORDS,
  OG_IMAGE,
  OG_IMAGE_ALT,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/seo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `(function(){try{var s=localStorage.getItem("theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.classList.toggle("light",!d);r.style.colorScheme=d?"dark":"light";r.dataset.theme=s||"system";}catch(e){}})();`;

const viewTransitionCss = `::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}::view-transition-new(root){animation:theme-reveal 480ms cubic-bezier(0.22,1,0.36,1);}@keyframes theme-reveal{from{clip-path:circle(0px at var(--theme-reveal-x,50%) var(--theme-reveal-y,50%));}to{clip-path:circle(var(--theme-reveal-r,150vmax) at var(--theme-reveal-x,50%) var(--theme-reveal-y,50%));}}@media (prefers-reduced-motion: reduce){::view-transition-old(root),::view-transition-new(root){animation:none;}}`;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "zh-CN",
      image: `${SITE_URL}/og.png`,
      sameAs: ["https://github.com/ChongxiSama/mai-finder"],
      publisher: { "@id": "https://chongxi.us/#person" },
    },
    {
      "@type": "Person",
      "@id": "https://chongxi.us/#person",
      name: "Chongxi",
      alternateName: ["xi", "重熙", "Chongxi3555"],
      url: "https://chongxi.us/",
      image: "https://github.com/ChongxiSama.png",
      sameAs: [
        "https://chongxi.us/",
        "https://xice.cx/",
        "https://github.com/ChongxiSama",
        "https://orcid.org/0009-0007-9348-1534",
      ],
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — mai-finder",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Chongxi", url: "https://chongxi.us/" }],
  creator: "Chongxi",
  publisher: "mai-finder",
  keywords: KEYWORDS,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: OG_IMAGE_ALT }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: viewTransitionCss }} />
      </head>
      <body className="h-full overflow-hidden bg-background text-foreground">
        <JsonLd data={websiteJsonLd} />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <AppShell manifest={readManifest()}>{children}</AppShell>
      </body>
    </html>
  );
}
