"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FavouriteButtonProps {
  templateId: string;
  favouriteCount: number;
  isFavourited: boolean;
  variant?: "card" | "detail";
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default function FavouriteButton({
  templateId,
  favouriteCount: initialCount,
  isFavourited: initialFavourited,
  variant = "card",
}: FavouriteButtonProps) {
  const router = useRouter();
  const [isFavourited, setIsFavourited] = useState(initialFavourited);
  const [favouriteCount, setFavouriteCount] = useState(initialCount);
  const [isToggling, setIsToggling] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    setIsToggling(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/favourite`, {
        method: "POST",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Favourite toggle failed:", data.error ?? res.statusText);
        return;
      }

      const data = await res.json();
      setIsFavourited(data.favourited);
      setFavouriteCount(data.favourite_count ?? favouriteCount + (data.favourited ? 1 : -1));
    } catch (err) {
      console.error("Favourite toggle error:", err);
    } finally {
      setIsToggling(false);
    }
  };

  const isCard = variant === "card";
  const isDetail = variant === "detail";
  const buttonClass = isCard
    ? "flex items-center gap-0.5 rounded-full pl-1 pr-1.5 py-0.5 bg-base-100/80 hover:bg-base-100 text-base-content/80 hover:text-error min-w-0"
    : isDetail
      ? "flex items-center gap-2 rounded-full pl-3 pr-4 py-2 bg-base-100/90 hover:bg-base-100 text-base-content/80 hover:text-error min-w-0 shadow-lg"
      : "btn btn-ghost btn-sm gap-1.5";
  const iconClass = isCard ? "w-4 h-4 shrink-0" : isDetail ? "w-8 h-8 shrink-0" : "w-5 h-5";
  const filledClass = isFavourited ? "text-error" : "";
  const countClass = isCard ? "text-[10px]" : isDetail ? "text-base font-semibold" : "text-sm font-medium";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isToggling}
      className={buttonClass}
      title={isFavourited ? "Remove from favourites" : "Add to favourites"}
      aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
      data-umami-event="favourite_toggle"
    >
      <HeartIcon filled={isFavourited} className={`${iconClass} ${filledClass}`} />
      <span className={`tabular-nums whitespace-nowrap ${countClass}`}>
        {favouriteCount.toLocaleString()}
      </span>
    </button>
  );
}
