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
  let faviconUrl = getDirectImageUrl("https://drive.google.com/file/d/1XwZ7delmyW1BidhtNhtR-46t36urm81D/view?usp=drivesdk");
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
      icon: faviconUrl
    },
    openGraph: ogImageUrl ? {
      images: [ogImageUrl]
    } : undefined
  };
}

import ChatbotWidget from "@/components/ChatbotWidget";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings: Record<string, string> = {};
  try {
    settings = await getPublicSettings();
  } catch (e) {}

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PJNV4L6R');`
          }}
        />
        {/* End Google Tag Manager */}
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X2Z6NCHQXJ"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-X2Z6NCHQXJ');`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PJNV4L6R"
            height="0" 
            width="0" 
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          {children}
          <ActivePing />
          <ChatbotWidget settings={settings} />
        </Providers>
      </body>
    </html>
  );
}
