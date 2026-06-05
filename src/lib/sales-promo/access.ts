import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppRole } from "@/lib/auth/types"
import type { ProfileRow } from "@/lib/auth/types"
import { rowMatchesTenant } from "@/lib/tenant-data-scope"

export function isSalesPromoAdminRole(role: AppRole): boolean {
  return role === "master_admin" || role === "admin"
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

  if (activeTenantKey && !rowMatchesTenant(data.tenant_key as string | null, activeTenantKey)) {
    return false
  }

  if (isSalesPromoAdminRole(profile.role)) {
    return true
  }

  if (profile.role !== "manager") return false

  const { data: share, error: shareErr } = await admin
    .from("sales_promo_document_shares")
    .select("document_id")
    .eq("document_id", documentId)
    .eq("user_id", profile.id)
    .maybeSingle()

  if (shareErr) return false
  return !!share
}
