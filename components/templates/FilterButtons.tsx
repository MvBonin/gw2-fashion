"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ArmorType = "light" | "medium" | "heavy" | null;
type SortOption = "trending" | "popular" | "new";

interface FilterButtonsProps {
  armorFilter: ArmorType;
  sortOption: SortOption;
}

export default function FilterButtons({
  armorFilter,
  sortOption,
}: FilterButtonsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (armor: ArmorType, sort: SortOption) => {
    const params = new URLSearchParams();
    if (armor) params.set("armor", armor);
    if (sort) params.set("sort", sort);
    router.push(`/?${params.toString()}`);
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

      {/* Sort Options */}
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
    </div>
  );
}

