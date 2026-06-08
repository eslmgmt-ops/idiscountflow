"use client"

import * as React from "react"
import {
  DEFAULT_TABLE_PAGE_SIZE,
  isTablePageSize,
  TABLE_PAGE_SIZE_OPTIONS,
  type TablePageSize,
} from "@/lib/table-pagination"
import { cn } from "@/lib/utils"

export function TablePageSizeSelect({
  value = DEFAULT_TABLE_PAGE_SIZE,
  onChange,
  className,
  id,
}: {
  value?: TablePageSize
  onChange: (next: TablePageSize) => void
  className?: string
  id?: string
}) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="whitespace-nowrap">Rows per page</span>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          const next = Number(e.target.value)
          if (isTablePageSize(next)) onChange(next)
        }}
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  )
}
