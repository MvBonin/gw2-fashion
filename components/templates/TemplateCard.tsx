"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { abbreviateFashionCode, copyToClipboard } from "@/lib/utils/fashionCode";
import { getCopiedIds, addCopiedId } from "@/lib/utils/trackingStorage";
import FavouriteButton from "@/components/templates/FavouriteButton";

interface TemplateCardProps {
  id: string;
  name: string;
  slug: string;
  fashion_code: string;
  armor_type: "light" | "medium" | "heavy";
  image_url: string | null;
  view_count: number;
  copy_count: number;
  favourite_count: number;
  isFavourited?: boolean;
  user?: {
    username: string;
  } | null;
  templateUserId?: string | null;
  tags?: string[];
  isPrivate?: boolean;
}

const MAX_VISIBLE_TAGS = 4;

export default function TemplateCard({
  id,
  name,
  slug,
  fashion_code,
  armor_type,
  image_url,
  view_count,
  copy_count,
  favourite_count,
  isFavourited = false,
  user,
  templateUserId,
  tags = [],
  isPrivate = false,
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

      const alreadyCopied = getCopiedIds().includes(id);
      if (!alreadyCopied) {
        const res = await fetch(`/api/templates/${id}/copy`, {
          method: "POST",
        });
        if (res.ok) addCopiedId(id);
        else console.warn("Copy tracking failed:", res.status);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying code:", error);
    } finally {
      setIsCopying(false);
    }
  };

  const abbreviatedCode = abbreviateFashionCode(fashion_code, 32);

  return (
    <Link href={`/template/${slug}`} className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow compact">
      <figure className="relative w-full aspect-[9/16] bg-base-300">
        {image_url ? (
          <Image
            src={image_url}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/30">
            <svg
              className="w-12 h-12 sm:w-14 sm:h-14"
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
        <div className="absolute top-1 left-1 z-10">
          <FavouriteButton
            templateId={id}
            favouriteCount={favourite_count}
            isFavourited={isFavourited}
            variant="card"
          />
        </div>
        <div className="absolute top-1 right-1">
          <span className="badge badge-primary badge-xs capitalize">
            {armor_type}
          </span>
        </div>
        {isPrivate && (
          <div className="absolute bottom-1 right-1">
            <span className="badge badge-ghost badge-xs opacity-90">Private</span>
          </div>
        )}
      </figure>
      <div className="card-body p-2 sm:p-3">
        <h2 className="card-title text-sm line-clamp-1" title={name}>{name}</h2>
        {user && (
          <p className="text-xs text-base-content/70 truncate">by {user.username}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.slice(0, MAX_VISIBLE_TAGS).map((tag, i) => (
              <span key={i} className="badge badge-ghost badge-xs">
                {tag}
              </span>
            ))}
            {tags.length > MAX_VISIBLE_TAGS && (
              <span className="badge badge-ghost badge-xs">+{tags.length - MAX_VISIBLE_TAGS}</span>
            )}
          </div>
        )}
        <p className="text-xs text-base-content/70 mt-4">Fashion Code:</p>

        <div className="join w-full flex min-w-0 mb-4">
          <input
            type="text"
            readOnly
            disabled
            className="input join-item flex-1 min-w-0 font-mono text-xs bg-base-200 border-base-300 truncate h-5"
            value={abbreviatedCode}
            aria-label="Fashion code"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-primary join-item btn-xs shrink-0 h-5"
            disabled={isCopying}
            title="Copy full code"
            data-umami-event="copy_code_card"
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-2 text-[10px] text-base-content/60 mt-0.5">
          <span>👁️ {view_count.toLocaleString()}</span>
          <span>📋 {copy_count.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}

