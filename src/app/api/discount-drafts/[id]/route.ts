import { NextResponse } from "next/server"
import { rejectIfManager } from "@/lib/auth/permissions"
import { getCurrentProfile } from "@/lib/auth/profile"
import { draftRowsPayloadForDb } from "@/lib/bulk-discount-io"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { rowMatchesTenant } from "@/lib/tenant-data-scope"

async function assertOwnDraft(
  admin: ReturnType<typeof createServiceRoleClient>,
  draftId: string,
  userId: string,
  tenantKey: string,
) {
  const { data, error } = await admin
    .from("bulk_discount_drafts")
    .select("id,created_by,title,rows,tenant_key,created_at,updated_at")
    .eq("id", draftId)
    .maybeSingle()

  if (error) return { ok: false as const, response: NextResponse.json({ error: error.message }, { status: 500 }) }
  if (!data || data.created_by !== userId) {
    return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  }
  if (!rowMatchesTenant(data.tenant_key as string | null, tenantKey)) {
    return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) }
  }
  return { ok: true as const, draft: data }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { id } = await params
  const check = await assertOwnDraft(admin, id, uid, tenantKey)
  if (!check.ok) return check.response

  return NextResponse.json({ draft: check.draft, tenantKey })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { id } = await params
  const check = await assertOwnDraft(admin, id, uid, tenantKey)
  if (!check.ok) return check.response

  let body: { title?: unknown; rows?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.title === "string") {
    patch.title = body.title.trim().slice(0, 200) || "Untitled draft"
  }
  if (body.rows !== undefined) {
    const rowsPayload = draftRowsPayloadForDb(body.rows)
    if (rowsPayload) patch.rows = rowsPayload
  }

  const { data, error } = await admin
    .from("bulk_discount_drafts")
    .update(patch)
    .eq("id", id)
    .select("id,title,rows,tenant_key,created_at,updated_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 })
  }

  return NextResponse.json({ draft: data, tenantKey })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { id } = await params
  const check = await assertOwnDraft(admin, id, uid, tenantKey)
  if (!check.ok) return check.response

  const { error } = await admin.from("bulk_discount_drafts").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
