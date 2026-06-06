import { NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import type { SharedSalesPromoDoc } from "@/lib/manager-promo-shares"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { tenantsForProfile } from "@/lib/treez-tenants"

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
      const { data: shareRows } = await admin
        .from("sales_promo_document_shares")
        .select("document_id")
        .eq("user_id", actor.id)
      const ids = Array.from(
        new Set((shareRows ?? []).map((r) => r.document_id as string).filter(Boolean)),
      )
      if (ids.length) {
        const { data: docs } = await admin
          .from("sales_promo_documents")
          .select("id, title")
          .in("id", ids)
          .order("title", { ascending: true })
        sharedSalesPromoDocuments = (docs ?? [])
          .filter((d) => typeof d.id === "string" && typeof d.title === "string")
          .map((d) => ({ id: d.id as string, title: d.title as string }))
      }
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
