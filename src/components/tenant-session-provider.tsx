"use client"

import * as React from "react"
import type { TenantOption } from "@/components/tenant-selector"
import { useTenantSession } from "@/lib/use-tenant-session"

type TenantSessionContextValue = {
  tenants: TenantOption[]
  tenantKey: string | null
  loading: boolean
  error: string | null
  setTenantKey: (key: string) => Promise<boolean>
  refresh: () => Promise<void>
}

const TenantSessionContext = React.createContext<TenantSessionContextValue | null>(null)

export function TenantSessionProvider({ children }: { children: React.ReactNode }) {
  const session = useTenantSession()
  return (
    <TenantSessionContext.Provider value={session}>{children}</TenantSessionContext.Provider>
  )
}

export function useTenantSessionContext(): TenantSessionContextValue {
  const ctx = React.useContext(TenantSessionContext)
  if (!ctx) {
    throw new Error("useTenantSessionContext must be used within TenantSessionProvider")
  }
  return ctx
}

/** Safe outside provider (e.g. tests); returns null when not wrapped. */
export function useTenantSessionContextOptional(): TenantSessionContextValue | null {
  return React.useContext(TenantSessionContext)
}
