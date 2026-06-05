import { fetchOrgStores } from "@/lib/treez"
import { parseOrgStoreNamesFromTreezPayload } from "@/lib/org-store-names"
import { getTreezEnvForTenant } from "@/lib/treez-tenants"

export async function normalizeAndValidateManagerStoreNames(
  incoming: unknown,
  tenantKey: string,
): Promise<{ ok: true; names: string[] } | { ok: false; error: string }> {
  if (!Array.isArray(incoming)) {
    return { ok: false, error: "assigned_store_names must be an array of store name strings" }
  }
  const raw = [...new Set(incoming.map((x) => String(x ?? "").trim()).filter(Boolean))]
  if (raw.length === 0) {
    return { ok: false, error: "Select at least one store location for a manager" }
  }
  let body: unknown
  try {
    body = await fetchOrgStores(getTreezEnvForTenant(tenantKey))
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not load organization stores from Treez",
    }
  }
  const allowed = new Set(parseOrgStoreNamesFromTreezPayload(body))
  for (const n of raw) {
    if (!allowed.has(n)) {
      return { ok: false, error: `Store name is not in this store's location catalog: ${n}` }
    }
  }
  return { ok: true, names: [...raw].sort((a, b) => a.localeCompare(b)) }
}

export function normalizeTenantKeys(
  incoming: unknown,
  allowedKeys?: Set<string>,
): { ok: true; keys: string[] } | { ok: false; error: string } {
  if (!Array.isArray(incoming)) {
    return { ok: false, error: "assigned_tenant_keys must be an array of store keys" }
  }
  const keys = [...new Set(incoming.map((x) => String(x ?? "").trim().toLowerCase()).filter(Boolean))]
  if (keys.length === 0) {
    return { ok: false, error: "Select at least one store for a manager" }
  }
  if (allowedKeys) {
    for (const k of keys) {
      if (!allowedKeys.has(k)) {
        return { ok: false, error: `Store is not configured: ${k}` }
      }
    }
  }
  return { ok: true, keys: [...keys].sort((a, b) => a.localeCompare(b)) }
}

export async function normalizeAndValidateManagerStoreNamesForTenants(
  incoming: unknown,
  tenantKeys: string[],
): Promise<{ ok: true; names: string[] } | { ok: false; error: string }> {
  if (!Array.isArray(incoming)) {
    return { ok: false, error: "assigned_store_names must be an array of store name strings" }
  }
  const raw = [...new Set(incoming.map((x) => String(x ?? "").trim()).filter(Boolean))]
  if (raw.length === 0) {
    return { ok: false, error: "Select at least one store location for a manager" }
  }
  if (tenantKeys.length === 0) {
    return { ok: false, error: "Select at least one store before assigning locations" }
  }

  const allowed = new Set<string>()
  for (const tenantKey of tenantKeys) {
    let body: unknown
    try {
      body = await fetchOrgStores(getTreezEnvForTenant(tenantKey))
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : `Could not load locations for store ${tenantKey}`,
      }
    }
    for (const n of parseOrgStoreNamesFromTreezPayload(body)) {
      allowed.add(n)
    }
  }

  for (const n of raw) {
    if (!allowed.has(n)) {
      return { ok: false, error: `Location is not in the selected stores' catalogs: ${n}` }
    }
  }
  return { ok: true, names: [...raw].sort((a, b) => a.localeCompare(b)) }
}
