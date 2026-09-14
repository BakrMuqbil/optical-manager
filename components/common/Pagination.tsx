"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const isFirstPage = page <= 1;
  const isLastPage = page >= safeTotalPages;

  if (safeTotalPages <= 1 && !total) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t p-4"
      style={{ borderColor: "var(--border)" }}
      dir="rtl"
    >
      <div
        className="text-sm font-bold"
        style={{ color: "var(--text-muted)" }}
      >
        {total !== undefined
          ? `إجمالي السجلات: ${total}`
          : `صفحة ${page} من ${safeTotalPages}`}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage || loading}
        >
          <ChevronRight size={16} />
          السابق
        </button>

        <span
          className="min-w-28 rounded-lg px-3 py-2 text-center text-sm font-black"
          style={{
            background: "var(--surface-muted)",
            color: "var(--text-primary)",
          }}
        >
          صفحة {page} من {safeTotalPages}
        </span>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage || loading}
        >
          التالي
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}