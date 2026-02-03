"use client";

import Link from "next/link";

export interface PaginationNavSearchParams {
  armor?: string;
  sort?: string;
  [key: string]: string | undefined;
}

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  basePath: string;
  searchParams: PaginationNavSearchParams;
}

function buildPageUrl(basePath: string, searchParams: PaginationNavSearchParams, page: number): string {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value != null && value !== "") params.set(key, value);
  });
  params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath.replace(/\?.*$/, "")}?${qs}` : basePath;
}

export default function PaginationNav({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  basePath,
  searchParams,
}: PaginationNavProps) {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) pageNumbers.push("ellipsis");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    if (currentPage < totalPages - 2) pageNumbers.push("ellipsis");
    if (totalPages > 1) pageNumbers.push(totalPages);
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 mt-8" aria-label="Pagination">
      <p className="text-sm text-base-content/60 mr-2 shrink-0">
        {from}–{to} of {totalCount}
      </p>
      <div className="join">
        {currentPage > 1 ? (
          <Link
            href={buildPageUrl(basePath, searchParams, currentPage - 1)}
            className="join-item btn btn-sm"
            aria-label="Previous page"
          >
            Previous
          </Link>
        ) : (
          <span className="join-item btn btn-sm btn-disabled" aria-disabled>
            Previous
          </span>
        )}
        {pageNumbers.map((n, i) =>
          n === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="join-item btn btn-sm btn-disabled">
              …
            </span>
          ) : (
            <Link
              key={n}
              href={buildPageUrl(basePath, searchParams, n)}
              className={`join-item btn btn-sm ${n === currentPage ? "btn-active" : ""}`}
              aria-label={n === currentPage ? `Page ${n} (current)` : `Page ${n}`}
              aria-current={n === currentPage ? "page" : undefined}
            >
              {n}
            </Link>
          )
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildPageUrl(basePath, searchParams, currentPage + 1)}
            className="join-item btn btn-sm"
            aria-label="Next page"
          >
            Next
          </Link>
        ) : (
          <span className="join-item btn btn-sm btn-disabled" aria-disabled>
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
