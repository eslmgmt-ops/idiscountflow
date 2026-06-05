import type { ProfileRow } from "@/lib/auth/types"
import type { TreezEnv } from "@/lib/treez"
import {
  getTreezEnvForTenant,
  getTreezTenant,
  tenantKeysForProfile,
  type TreezTenant,
} from "@/lib/treez-tenants"

export const TREEZ_TENANT_COOKIE = "treez_tenant_key"

function readCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) {
      const v = rest.join("=").trim()
      return v ? decodeURIComponent(v) : undefined
    }
  }
  return undefined
}

export function getTenantKeyFromRequest(req: Request): string | undefined {
  const url = new URL(req.url)
  const fromQuery = url.searchParams.get("tenant")?.trim().toLowerCase()
  if (fromQuery) return fromQuery

  const fromHeader = req.headers.get("x-treez-tenant")?.trim().toLowerCase()
  if (fromHeader) return fromHeader

  return readCookieValue(req.headers.get("cookie"), TREEZ_TENANT_COOKIE)?.trim().toLowerCase()
}

export type ResolvedTreezTenant = {
  tenantKey: string
  tenant: TreezTenant
  env: TreezEnv
}

export function resolveTreezTenantForProfile(
  profile: ProfileRow,
  requestedKey?: string,
): ResolvedTreezTenant {
  const accessible = tenantKeysForProfile(profile)
  if (accessible.length === 0) {
    throw new Error("No store access assigned. Contact an admin.")
  }

  let key = requestedKey?.trim().toLowerCase()
  if (!key || !accessible.includes(key)) {
    key = accessible[0]!
  }

  const tenant = getTreezTenant(key)
  if (!tenant) {
    throw new Error(`Store tenant is not configured: ${key}`)
  }

  return {
    tenantKey: key,
    tenant,
    env: getTreezEnvForTenant(key),
  }
}

export function resolveTreezTenantForRequest(
  req: Request,
  profile: ProfileRow,
): ResolvedTreezTenant {
  return resolveTreezTenantForProfile(profile, getTenantKeyFromRequest(req))
}
