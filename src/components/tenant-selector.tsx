"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getStoreVisual } from "@/lib/store-visuals"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon, Loader2Icon } from "lucide-react"

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

  const activeKey = value ?? tenants[0]?.key ?? null

  const selected = React.useMemo(
    () => tenants.find((t) => t.key === activeKey) ?? tenants[0] ?? null,
    [tenants, activeKey],
  )

  const handleSelect = React.useCallback(
    async (key: string) => {
      if (!key || key === activeKey) {
        setOpen(false)
        return
      }
      setOpen(false)
      setSwitching(true)
      try {
        await onChange(key)
      } catch {
        /* parent may toast */
      } finally {
        setSwitching(false)
      }
    },
    [onChange, activeKey],
  )

  if (!selected || tenants.length === 0) return null

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
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
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={6} className="w-60 p-1.5">
        <PopoverHeader className="px-2 pb-1 pt-0.5">
          <PopoverTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Switch store
          </PopoverTitle>
        </PopoverHeader>
        <ul className="flex flex-col gap-0.5" role="listbox" aria-label="Stores">
          {tenants.map((tenant) => {
            const isActive = tenant.key === activeKey
            return (
              <li key={tenant.key} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  disabled={busy}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isActive && "bg-accent/60",
                  )}
                  onClick={() => void handleSelect(tenant.key)}
                >
                  <StoreMark tenant={tenant} size="md" />
                  <span className="min-w-0 flex-1 truncate font-medium">{tenant.label}</span>
                  {isActive ? (
                    <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
