import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Providers from "@/components/Providers";
import ActivePing from "@/components/layout/ActivePing";

import { getPublicSettings } from "@/actions/setting";
import { getDirectImageUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Hệ thống quản lý minh chứng kiểm định chất lượng số Nam Sài Gòn";
  let description = "Hệ thống quản lý minh chứng kiểm định chất lượng - Trường Cao đẳng Bách khoa Nam Sài Gòn";
  let logoUrl = "/favicon.ico";
  let ogImageUrl = "";

  try {
    const settings = await getPublicSettings();
    if (settings["SEO_TITLE"]) title = settings["SEO_TITLE"];
    if (settings["SEO_DESCRIPTION"]) description = settings["SEO_DESCRIPTION"];
    if (settings["LOGO_URL"]) logoUrl = getDirectImageUrl(settings["LOGO_URL"]);
    if (settings["OG_IMAGE_URL"]) ogImageUrl = getDirectImageUrl(settings["OG_IMAGE_URL"]);
  } catch (e) {}

  return {
    title,
    description,
    icons: {
      icon: logoUrl
    },
    openGraph: ogImageUrl ? {
      images: [ogImageUrl]
    } : undefined
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <ActivePing />
        </Providers>
      </body>
    </html>
  );
}
