"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { abbreviateFashionCode, copyToClipboard } from "@/lib/utils/fashionCode";

interface TemplateCardProps {
  id: string;
  name: string;
  slug: string;
  fashion_code: string;
  armor_type: "light" | "medium" | "heavy";
  image_url: string | null;
  view_count: number;
  copy_count: number;
  user?: {
    username: string;
  } | null;
}

export default function TemplateCard({
  id,
  name,
  slug,
  fashion_code,
  armor_type,
  image_url,
  view_count,
  copy_count,
  user,
}: TemplateCardProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCopying) return;

    setIsCopying(true);
    try {
      await copyToClipboard(fashion_code);

      // Track copy event
      await fetch(`/api/templates/${id}/copy`, {
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

  const abbreviatedCode = abbreviateFashionCode(fashion_code, 50);

  return (
    <Link href={`/template/${slug}`} className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
      <figure className="relative w-full h-48 bg-base-300">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/30">
            <svg
              className="w-24 h-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="badge badge-primary badge-sm capitalize">
            {armor_type}
          </span>
        </div>
      </figure>
      <div className="card-body">
        <h2 className="card-title text-lg">{name}</h2>
        {user && (
          <p className="text-sm text-base-content/70">by {user.username}</p>
        )}
        <div className="mt-2">
          <button
            onClick={handleCopyCode}
            className="text-left w-full p-2 bg-base-300 rounded hover:bg-base-content/10 transition-colors text-sm font-mono break-all"
            title="Click to copy full code"
          >
            {copied ? (
              <span className="text-success">✓ Copied!</span>
            ) : (
              <span className="text-base-content/80">{abbreviatedCode}</span>
            )}
          </button>
        </div>
        <div className="card-actions justify-end mt-2">
          <div className="flex gap-4 text-xs text-base-content/60">
            <span>👁️ {view_count.toLocaleString()}</span>
            <span>📋 {copy_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

