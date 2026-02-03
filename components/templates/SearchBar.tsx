"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 350;

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface SearchBarProps {
  /** Base path for search redirect (e.g. "/" or "/favourites"). Defaults to "/". */
  basePath?: string;
  /** Whether to show the author search field. Defaults to true. */
  showAuthor?: boolean;
}

export default function SearchBar({ basePath = "/", showAuthor = true }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [tag, setTag] = useState(() => searchParams.get("tag") ?? "");
  const [author, setAuthor] = useState(() => searchParams.get("author") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const applyParams = useCallback(
    (query: string, tagVal: string, authorVal: string) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (tagVal.trim()) params.set("tag", tagVal.trim());
      if (showAuthor && authorVal.trim()) params.set("author", authorVal.trim());
      const armor = searchParams.get("armor");
      if (armor) params.set("armor", armor);
      const sort = searchParams.get("sort");
      if (sort) params.set("sort", sort);
      params.set("page", "1");
      const norm = (p: URLSearchParams) =>
        [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&");
      const nextQuery = norm(params);
      const current = new URLSearchParams();
      ["q", "tag", "author", "armor", "sort"].forEach((k) => {
        const v = searchParams.get(k);
        if (v) current.set(k, v);
      });
      current.set("page", "1");
      if (nextQuery !== norm(current)) {
        const qs = params.toString();
        const path = basePath.replace(/\?.*$/, "");
        router.push(qs ? `${path}?${qs}` : path);
      }
    },
    [searchParams, router, basePath, showAuthor]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applyParams(q, tag, author), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, tag, author, applyParams]);

  // Sync from URL when user navigates back/forward
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setTag(searchParams.get("tag") ?? "");
    setAuthor(searchParams.get("author") ?? "");
  }, [searchParams]);

  const iconClass = "absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none";

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <label className="flex-1 min-w-[140px] relative">
        <span className="sr-only">Search for template</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a blueprint…"
          aria-label="Search for template"
          className="input input-bordered w-full pr-10 rounded-lg bg-base-200 border-base-300 text-base-content placeholder-base-content/50"
        />
        <span className={iconClass}>
          <SearchIcon />
        </span>
      </label>
      <label className="flex-1 min-w-[140px] relative">
        <span className="sr-only">Search for tag</span>
        <input
          type="search"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Search for any tag…"
          aria-label="Search for tag"
          className="input input-bordered w-full pr-10 rounded-lg bg-base-200 border-base-300 text-base-content placeholder-base-content/50"
        />
        <span className={iconClass}>
          <TagIcon />
        </span>
      </label>
      {showAuthor && (
        <label className="flex-1 min-w-[140px] relative">
          <span className="sr-only">Search by author</span>
          <input
            type="search"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Search by author…"
            aria-label="Search by author"
            className="input input-bordered w-full pr-10 rounded-lg bg-base-200 border-base-300 text-base-content placeholder-base-content/50"
          />
          <span className={iconClass}>
            <UserIcon />
          </span>
        </label>
      )}
    </div>
  );
}
