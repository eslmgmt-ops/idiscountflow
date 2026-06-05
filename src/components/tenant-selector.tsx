"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getStoreVisual } from "@/lib/store-visuals"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, Loader2Icon } from "lucide-react"

export type TenantOption = {
  key: string
  label: string
  dispensary: string
}

type TenantSelectorProps = {
  tenants: TenantOption[]
  value: string | null
  onChange: (key: string) => void | Promise<void>
  disabled?: boolean
  className?: string
}

function StoreMark({
  tenant,
  size = "sm",
}: {
  tenant: TenantOption
  size?: "sm" | "md"
}) {
  const visual = getStoreVisual(tenant.key, tenant.label)
  const Icon = visual.Icon
  const dim = size === "md" ? "size-8" : "size-7"
  const iconDim = size === "md" ? "size-4" : "size-3.5"

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
        dim,
        visual.bgClass,
      )}
      aria-hidden
    >
      <Icon className={cn(iconDim, visual.iconClass)} />
    </span>
  )
}

function StoreBadge({
  tenant,
  showChevron,
  loading,
}: {
  tenant: TenantOption
  showChevron?: boolean
  loading?: boolean
}) {
  return (
    <>
      <StoreMark tenant={tenant} />
      <span className="max-w-[10rem] truncate font-medium text-foreground">{tenant.label}</span>
      {loading ? (
        <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : showChevron ? (
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
    </>
  )
}

export function TenantSelector({
  tenants,
  value,
  onChange,
  disabled,
  className,
}: TenantSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [switching, setSwitching] = React.useState(false)

  const selected = React.useMemo(
    () => tenants.find((t) => t.key === value) ?? tenants[0] ?? null,
    [tenants, value],
  )

  if (!selected || tenants.length === 0) return null

  const handleSelect = React.useCallback(
    async (key: string) => {
      if (key === value) {
        setOpen(false)
        return
      }
      setSwitching(true)
      try {
        await onChange(key)
      } finally {
        setSwitching(false)
        setOpen(false)
      }
    },
    [onChange, value],
  )

  if (tenants.length === 1) {
    return (
      <div
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-background px-2.5 shadow-sm",
          className,
        )}
        title={`Store: ${selected.label}`}
      >
        <StoreBadge tenant={selected} />
      </div>
    )
  }

  const busy = disabled || switching

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={busy}
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-9 max-w-[min(100%,15rem)] gap-2 px-2.5 font-normal shadow-sm",
              className,
            )}
            aria-label={`Current store: ${selected.label}. Open store switcher.`}
          />
        }
      >
        <StoreBadge tenant={selected} showChevron loading={switching} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60" sideOffset={6}>
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Switch store
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value ?? selected.key}
          onValueChange={(key) => void handleSelect(key)}
        >
          {tenants.map((tenant) => (
            <DropdownMenuRadioItem
              key={tenant.key}
              value={tenant.key}
              disabled={busy}
              className="gap-2.5 py-2 pr-8"
            >
              <StoreMark tenant={tenant} size="md" />
              <span className="min-w-0 flex-1 truncate font-medium">{tenant.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
