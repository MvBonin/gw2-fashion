"use client";

import { openCookieSettings } from "@/components/layout/CookieBanner";

export default function CookieSettingsTrigger() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="link link-hover text-sm inline"
    >
      Cookie settings
    </button>
  );
}
