import { getDefaultTenantFromEnv } from "@/lib/treez-tenants"

/** Rows created before multi-tenant used an empty tenant_key. */
export const LEGACY_TENANT_KEY = ""

export function getDefaultTenantKey(): string | null {
  return getDefaultTenantFromEnv()?.key ?? null
}

/** Whether a stored row belongs to the active store (includes legacy → default store). */
export function rowMatchesTenant(
  rowTenantKey: string | null | undefined,
  activeTenantKey: string,
): boolean {
  const tk = (rowTenantKey ?? LEGACY_TENANT_KEY).trim().toLowerCase()
  const active = activeTenantKey.trim().toLowerCase()
  if (tk === active) return true
  if (tk === LEGACY_TENANT_KEY) {
    const defaultKey = getDefaultTenantKey()
    return !!defaultKey && active === defaultKey
  }
  return false
}

/** Supabase PostgREST `.or()` clause for listing rows in the active store. */
export function tenantFilterOrClause(activeTenantKey: string): string {
  const active = activeTenantKey.trim().toLowerCase()
  const defaultKey = getDefaultTenantKey()
  if (defaultKey && active === defaultKey) {
    return `tenant_key.eq.${active},tenant_key.eq.${LEGACY_TENANT_KEY}`
  }
  return `tenant_key.eq.${active}`
}
