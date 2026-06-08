import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppRole } from "@/lib/auth/types"
import type { ProfileRow } from "@/lib/auth/types"
import { rowMatchesTenant } from "@/lib/tenant-data-scope"
import { tenantKeysForProfile } from "@/lib/treez-tenants"

export function isSalesPromoAdminRole(role: AppRole): boolean {
  return role === "master_admin" || role === "admin"
}

export function profileCanAccessSalesPromoTenant(
  profile: ProfileRow,
  tenantKey: string,
): boolean {
  return tenantKeysForProfile(profile).some((key) => rowMatchesTenant(tenantKey, key))
}

export async function userCanAccessSalesPromoDocument(
  admin: SupabaseClient,
  profile: ProfileRow,
  documentId: string,
  activeTenantKey?: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("sales_promo_documents")
    .select("id,tenant_key")
    .eq("id", documentId)
    .maybeSingle()

  if (error || !data) return false

  const docTenantKey = data.tenant_key as string | null

  if (activeTenantKey && !rowMatchesTenant(docTenantKey, activeTenantKey)) {
    return false
  }

  if (isSalesPromoAdminRole(profile.role)) {
    return true
  }

  if (profile.role !== "manager") return false

  return tenantKeysForProfile(profile).some((key) => rowMatchesTenant(docTenantKey, key))
}
