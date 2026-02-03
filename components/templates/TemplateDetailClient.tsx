"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { copyToClipboard } from "@/lib/utils/fashionCode";
import { getCopiedIds, addCopiedId } from "@/lib/utils/trackingStorage";
import type { SkinsAndColorsEntry } from "@/lib/gw2/gw2Api";

interface TemplateDetailClientProps {
  templateId: string;
  fashionCode: string;
  templateUserId?: string | null;
  skinsAndColors?: SkinsAndColorsEntry[] | null;
}

export default function TemplateDetailClient({
  templateId,
  fashionCode,
  templateUserId,
  skinsAndColors,
}: TemplateDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyToClipboard(fashionCode);

      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const isOwner = templateUserId && currentUser?.id === templateUserId;
      const alreadyCopied = getCopiedIds().includes(templateId);

      if (!isOwner && !alreadyCopied) {
        const res = await fetch(`/api/templates/${templateId}/copy`, {
          method: "POST",
        });
        if (res.ok) addCopiedId(templateId);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
    } finally {
      setIsCopying(false);
    }
  };

  const hasSkinsAndColors = skinsAndColors && skinsAndColors.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Fashion Code</h2>
        <div className="join w-full flex">
          <input
            type="text"
            readOnly
            disabled
            className="input join-item flex-1 font-mono text-sm bg-base-200 border-base-300"
            value={fashionCode}
            aria-label="Fashion code"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-primary join-item shrink-0"
            disabled={isCopying}
          >
            {copied ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
        {!hasSkinsAndColors && (
          <p className="text-sm text-base-content/60">
            Equipment-Daten aus diesem Code sind nicht verfügbar (kein erkannter Fashion-Template-Typ).
          </p>
        )}
      </div>

      {hasSkinsAndColors && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Skins & Farben</h2>
          <ul className="space-y-4">
            {skinsAndColors!.map((entry, index) => (
              <li key={`${entry.slot}-${index}`} className="rounded-lg border border-base-300 bg-base-200/50 p-3">
                <div className="flex items-center gap-2 font-medium text-base-content">
                  {entry.skinIcon && (
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
                      <Image src={entry.skinIcon} alt="" width={32} height={32} className="object-cover" />
                    </span>
                  )}
                  <span className="capitalize">{entry.slot}</span>
                  <span className="text-base-content/70">–</span>
                  <span>{entry.skinName}</span>
                </div>
                {entry.showColors !== false && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {entry.colors.map((color, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full bg-base-300 px-2 py-0.5 text-sm"
                      title={`${color.name} (${color.hex})`}
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-base-content/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="truncate max-w-[120px]">{color.name}</span>
                      <span className="font-mono text-xs text-base-content/60" title={color.hex}>
                        {color.hex}
                      </span>
                    </span>
                  ))}
                </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

