"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ArmorType = "light" | "medium" | "heavy" | null;
type SortOption = "trending" | "popular" | "new";

interface FilterButtonsProps {
  armorFilter: ArmorType;
  sortOption: SortOption;
  /** Base path for links (e.g. "/" or "/profile/username"). Defaults to "/". */
  basePath?: string;
  /** Show sort buttons (trending/popular/new). Defaults to true. */
  showSort?: boolean;
}

export default function FilterButtons({
  armorFilter,
  sortOption,
  basePath = "/",
  showSort = true,
}: FilterButtonsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (armor: ArmorType, sort: SortOption) => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    const tag = searchParams.get("tag");
    if (tag) params.set("tag", tag);
    const author = searchParams.get("author");
    if (author) params.set("author", author);
    if (armor) params.set("armor", armor);
    if (showSort && sort) params.set("sort", sort);
    params.set("page", "1");
    const path = `${basePath.replace(/\?.*$/, "")}${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(path);
  };

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {/* Armor Type Filters */}
      <div className="join">
        <button
          type="button"
          onClick={() => updateFilter(null, sortOption)}
          className={`join-item btn ${
            !armorFilter ? "btn-active" : ""
          }`}
        >
          All Armor
        </button>
        <button
          type="button"
          onClick={() => updateFilter("light", sortOption)}
          className={`join-item btn ${
            armorFilter === "light" ? "btn-active" : ""
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => updateFilter("medium", sortOption)}
          className={`join-item btn ${
            armorFilter === "medium" ? "btn-active" : ""
          }`}
        >
          Medium
        </button>
        <button
          type="button"
          onClick={() => updateFilter("heavy", sortOption)}
          className={`join-item btn ${
            armorFilter === "heavy" ? "btn-active" : ""
          }`}
        >
          Heavy
        </button>
      </div>

      {/* Sort Options (optional, e.g. hidden on profile) */}
      {showSort && (
        <div className="join">
          <button
            type="button"
            onClick={() => updateFilter(armorFilter, "trending")}
            className={`join-item btn ${
              sortOption === "trending" ? "btn-active" : ""
            }`}
          >
            Trending
          </button>
          <button
            type="button"
            onClick={() => updateFilter(armorFilter, "popular")}
            className={`join-item btn ${
              sortOption === "popular" ? "btn-active" : ""
            }`}
          >
            Popular
          </button>
          <button
            type="button"
            onClick={() => updateFilter(armorFilter, "new")}
            className={`join-item btn ${
              sortOption === "new" ? "btn-active" : ""
            }`}
          >
            New
          </button>
        </div>
      )}
    </div>
  );
}

