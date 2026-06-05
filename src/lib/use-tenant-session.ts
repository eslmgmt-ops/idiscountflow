"use client"

import * as React from "react"
import type { TenantOption } from "@/components/tenant-selector"

type TenantSessionState = {
  tenants: TenantOption[]
  tenantKey: string | null
  loading: boolean
  error: string | null
  setTenantKey: (key: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useTenantSession(): TenantSessionState {
  const [tenants, setTenants] = React.useState<TenantOption[]>([])
  const [tenantKey, setTenantKeyState] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/session/tenant", {
        credentials: "same-origin",
        cache: "no-store",
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        tenants?: TenantOption[]
        currentTenantKey?: string | null
      }
      if (!res.ok || !data.ok) {
        setTenants(Array.isArray(data.tenants) ? data.tenants : [])
        setTenantKeyState(data.currentTenantKey ?? null)
        setError(data.error ?? "Could not load stores")
        return
      }
      setTenants(Array.isArray(data.tenants) ? data.tenants : [])
      setTenantKeyState(data.currentTenantKey ?? null)
    } catch {
      setError("Network error loading stores")
      setTenants([])
      setTenantKeyState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const setTenantKey = React.useCallback(async (key: string) => {
    try {
      const res = await fetch("/api/session/tenant", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantKey: key }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        currentTenantKey?: string
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not switch store")
        return false
      }
      setTenantKeyState(data.currentTenantKey ?? key)
      setError(null)
      window.dispatchEvent(new CustomEvent("treez-tenant-changed", { detail: { tenantKey: key } }))
      return true
    } catch {
      setError("Network error switching store")
      return false
    }
  }, [])

  return { tenants, tenantKey, loading, error, setTenantKey, refresh }
}
