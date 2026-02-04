import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/layout/CookieBanner";
import UmamiIdentify from "@/components/layout/UmamiIdentify";
import UmamiScript from "@/components/layout/UmamiScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "GW2 Fashion – Unofficial Fansite | Guild Wars 2 Fashion Templates",
  description: "Share and discover amazing fashion templates for Guild Wars 2",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "GW2 Fashion – Unofficial Fansite | Guild Wars 2 Fashion Templates",
    description: "Share and discover amazing fashion templates for Guild Wars 2",
    url: "/",
    siteName: "GW2 Fashion",
    images: [
      {
        url: "/icon.png",
        width: 265,
        height: 265,
        alt: "gw2-fashion.com Logo",
      },
    ],
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "GW2 Fashion – Unofficial Fansite | Guild Wars 2 Fashion Templates",
    description: "Share and discover amazing fashion templates for Guild Wars 2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="gw2-fashion">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieBanner />
        <UmamiScript />
        <UmamiIdentify />
      </body>
    </html>
  );
}
