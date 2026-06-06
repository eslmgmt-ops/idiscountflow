import type { LucideIcon } from "lucide-react"
import { StoreIcon } from "lucide-react"

export type StoreVisual = {
  initials: string
  Icon: LucideIcon
  bgClass: string
  iconClass: string
}

const UNIFORM_VISUAL = {
  Icon: StoreIcon,
  bgClass: "bg-primary/10 ring-primary/20",
  iconClass: "text-primary",
} as const

const KNOWN_INITIALS: Record<string, string> = {
  jackpot: "JP",
  metrocannabis: "MC",
}

function initialsFromLabel(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return label.trim().slice(0, 2).toUpperCase() || "ST"
}

/** Uniform icon and color for all companies. */
export function getStoreVisual(key: string, label: string): StoreVisual {
  const normalizedKey = key.trim().toLowerCase()
  return {
    initials: KNOWN_INITIALS[normalizedKey] ?? initialsFromLabel(label),
    ...UNIFORM_VISUAL,
  }
}
