import { NextResponse } from "next/server"
import { rejectIfManager } from "@/lib/auth/permissions"
import { getCurrentProfile } from "@/lib/auth/profile"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"
import { draftRowsPayloadForDb, parseDraftStorage } from "@/lib/bulk-discount-io"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { tenantFilterOrClause } from "@/lib/tenant-data-scope"

export async function GET(req: Request) {
  const actor = await getCurrentProfile()
  const denied = rejectIfManager(actor)
  if (denied) return denied
  const uid = actor!.id

  let tenantKey: string
  try {
    tenantKey = resolveTreezTenantForRequest(req, actor!).tenantKey
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not resolve store" },
      { status: 400 },
    )
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { data, error } = await admin
    .from("bulk_discount_drafts")
    .select("id,title,rows,tenant_key,created_at,updated_at")
    .eq("created_by", uid)
    .or(tenantFilterOrClause(tenantKey))
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const drafts = (data ?? []).map((d) => {
    const parsed = parseDraftStorage(d.rows)
    return {
      ...d,
      rowCount: parsed.rows.length,
    }
  })

  return NextResponse.json({ drafts, tenantKey })
}

export async function POST(request: Request) {
  const actor = await getCurrentProfile()
  const denied = rejectIfManager(actor)
  if (denied) return denied
  const uid = actor!.id

  let tenantKey: string
  try {
    tenantKey = resolveTreezTenantForRequest(request, actor!).tenantKey
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not resolve store" },
      { status: 400 },
    )
  }

  let body: { title?: unknown; rows?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : "Untitled draft"
  const rows = draftRowsPayloadForDb(body.rows) ?? { rows: [], pendingTreezDeletes: [] }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { data, error } = await admin
    .from("bulk_discount_drafts")
    .insert({
      title,
      rows,
      created_by: uid,
      tenant_key: tenantKey,
    })
    .select("id,title,rows,tenant_key,created_at,updated_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 })
  }

  return NextResponse.json({ draft: data, tenantKey })
}
