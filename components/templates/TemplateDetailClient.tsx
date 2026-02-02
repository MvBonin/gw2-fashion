"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils/fashionCode";

interface TemplateDetailClientProps {
  templateId: string;
  fashionCode: string;
}

export default function TemplateDetailClient({
  templateId,
  fashionCode,
}: TemplateDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyToClipboard(fashionCode);

      // Track copy event
      await fetch(`/api/templates/${templateId}/copy`, {
        method: "POST",
      });

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Fashion Code</h2>
        <div className="relative">
          <pre className="p-4 bg-base-300 rounded-lg overflow-x-auto text-sm font-mono">
            {fashionCode}
          </pre>
          <button
            onClick={handleCopy}
            className="btn btn-primary btn-sm absolute top-2 right-2"
            disabled={isCopying}
          >
            {copied ? (
              <>
                <span>✓ Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

