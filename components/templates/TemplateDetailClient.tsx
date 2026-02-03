"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { copyToClipboard } from "@/lib/utils/fashionCode";
import { getCopiedIds, addCopiedId } from "@/lib/utils/trackingStorage";

interface TemplateDetailClientProps {
  templateId: string;
  fashionCode: string;
  templateUserId?: string | null;
}

export default function TemplateDetailClient({
  templateId,
  fashionCode,
  templateUserId,
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

  return (
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
    </div>
  );
}

