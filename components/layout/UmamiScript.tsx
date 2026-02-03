"use client";

import Script from "next/script";

const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function UmamiScript() {
  if (!scriptUrl?.trim() || !websiteId?.trim()) return null;

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="beforeInteractive"
    />
  );
}
