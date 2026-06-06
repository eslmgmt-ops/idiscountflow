import type { LucideIcon } from "lucide-react"
import { StoreIcon } from "lucide-react"

export type StoreVisual = {
  initials: string
  Icon: LucideIcon
  bgClass: string
  iconClass: string
}

const KNOWN_STORES: Record<string, StoreVisual> = {
  jackpot: {
    initials: "JP",
    Icon: StoreIcon,
    bgClass: "bg-amber-500/15 ring-amber-500/25",
    iconClass: "text-amber-700 dark:text-amber-400",
  },
  metrocannabis: {
    initials: "MC",
    Icon: StoreIcon,
    bgClass: "bg-emerald-500/15 ring-emerald-500/25",
    iconClass: "text-emerald-700 dark:text-emerald-400",
  },
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return label.trim().slice(0, 2).toUpperCase() || "ST"
}

/** Uniform store icon with distinct color per known company; fallback for primary / custom tenants. */
export function getStoreVisual(key: string, label: string): StoreVisual {
  const known = KNOWN_STORES[key.trim().toLowerCase()]
  if (known) return known

  return {
    initials: initialsFromLabel(label),
    Icon: StoreIcon,
    bgClass: "bg-primary/10 ring-primary/20",
    iconClass: "text-primary",
  }
}
