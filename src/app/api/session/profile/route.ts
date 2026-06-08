import { NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import type { SharedSalesPromoDoc } from "@/lib/manager-promo-shares"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { tenantFilterOrClause } from "@/lib/tenant-data-scope"
import { tenantsForProfile, tenantKeysForProfile } from "@/lib/treez-tenants"

/** Session profile for dashboard clients (includes manager store assignments). */
export async function GET() {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized", profile: null }, { status: 401 })
  }

  let sharedSalesPromoDocuments: SharedSalesPromoDoc[] = []
  if (actor.role === "manager") {
    try {
      const admin = createServiceRoleClient()
      const byId = new Map<string, SharedSalesPromoDoc>()
      for (const key of tenantKeysForProfile(actor)) {
        const { data: docs } = await admin
          .from("sales_promo_documents")
          .select("id, title")
          .or(tenantFilterOrClause(key))
          .order("title", { ascending: true })
        for (const d of docs ?? []) {
          if (typeof d.id === "string" && typeof d.title === "string") {
            byId.set(d.id, { id: d.id, title: d.title })
          }
        }
      }
      sharedSalesPromoDocuments = [...byId.values()].sort((a, b) =>
        a.title.localeCompare(b.title),
      )
    } catch {
      sharedSalesPromoDocuments = []
    }
  }

  return NextResponse.json({
    ok: true,
    profile: actor,
    tenants: tenantsForProfile(actor),
    sharedSalesPromoDocuments,
  })
}
