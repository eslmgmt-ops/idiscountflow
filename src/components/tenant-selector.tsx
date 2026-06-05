"use client"

import * as React from "react"
import { StoreIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type TenantOption = {
  key: string
  label: string
  dispensary: string
}

type TenantSelectorProps = {
  tenants: TenantOption[]
  value: string | null
  onChange: (key: string) => void
  disabled?: boolean
  className?: string
}

export function TenantSelector({
  tenants,
  value,
  onChange,
  disabled,
  className,
}: TenantSelectorProps) {
  if (tenants.length <= 1) return null

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StoreIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor="tenant-select" className="sr-only">
        Select store
      </label>
      <select
        id="tenant-select"
        value={value ?? ""}
        disabled={disabled || tenants.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 max-w-[min(100%,14rem)] rounded-lg border border-input bg-background px-3 text-sm",
          "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        )}
      >
        {tenants.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  )
}
