import { getTreezEnv, type TreezEnv } from "@/lib/treez"

export type TreezTenant = {
  /** Stable slug used in cookies, query params, and user assignments. */
  key: string
  /** Human-readable name shown in the store selector. */
  label: string
  orgId: string
  dispensary: string
}

type TreezTenantInput = {
  key?: unknown
  label?: unknown
  orgId?: unknown
  dispensary?: unknown
}

function slugFromDispensary(dispensary: string): string {
  return dispensary.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "primary"
}

function parseTenantsJson(raw: string): TreezTenant[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const out: TreezTenant[] = []
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue
    const t = item as TreezTenantInput
    const orgId = String(t.orgId ?? "").trim()
    const dispensary = String(t.dispensary ?? "").trim()
    if (!orgId || !dispensary) continue
    const key = String(t.key ?? slugFromDispensary(dispensary)).trim().toLowerCase()
    const label = String(t.label ?? dispensary).trim() || dispensary
    out.push({ key, label, orgId, dispensary })
  }
  return out
}

/** Default tenant from existing TREEZ_ORG_ID / TREEZ_DISPENSARY env vars. */
export function getDefaultTenantFromEnv(): TreezTenant | null {
  try {
    const base = getTreezEnv()
    const dispensary = base.dispensary?.trim()
    if (!base.orgId?.trim() || !dispensary) return null
    return {
      key: slugFromDispensary(dispensary),
      label: dispensary,
      orgId: base.orgId.trim(),
      dispensary,
    }
  } catch {
    return null
  }
}

/** All configured Treez tenants (default env store + TREEZ_TENANTS JSON). */
export function listTreezTenants(): TreezTenant[] {
  const tenants: TreezTenant[] = []
  const seenKeys = new Set<string>()
  const seenOrgIds = new Set<string>()

  const push = (t: TreezTenant) => {
    if (seenKeys.has(t.key) || seenOrgIds.has(t.orgId)) return
    seenKeys.add(t.key)
    seenOrgIds.add(t.orgId)
    tenants.push(t)
  }

  const defaultTenant = getDefaultTenantFromEnv()
  if (defaultTenant) push(defaultTenant)

  const extra = process.env.TREEZ_TENANTS?.trim()
  if (extra) {
    for (const t of parseTenantsJson(extra)) push(t)
  }

  return tenants
}

export function getTreezTenant(key: string): TreezTenant | null {
  const k = key.trim().toLowerCase()
  return listTreezTenants().find((t) => t.key === k) ?? null
}

/** Treez API credentials for a specific tenant (shared cert/key, per-tenant org/dispensary). */
export function getTreezEnvForTenant(tenantKey: string): TreezEnv {
  const tenant = getTreezTenant(tenantKey)
  if (!tenant) {
    throw new Error(`Unknown store tenant: ${tenantKey}`)
  }
  const base = getTreezEnv()
  return {
    ...base,
    orgId: tenant.orgId,
    dispensary: tenant.dispensary,
  }
}

export function tenantKeysForProfile(profile: {
  role: string
  assigned_tenant_keys: string[]
}): string[] {
  const all = listTreezTenants().map((t) => t.key)
  if (profile.role === "master_admin" || profile.role === "admin") {
    return all
  }
  const allowed = new Set(all)
  return (profile.assigned_tenant_keys ?? []).filter((k) => allowed.has(k.trim().toLowerCase()))
}

export function tenantsForProfile(profile: {
  role: string
  assigned_tenant_keys: string[]
}): TreezTenant[] {
  const keys = new Set(tenantKeysForProfile(profile))
  return listTreezTenants().filter((t) => keys.has(t.key))
}
