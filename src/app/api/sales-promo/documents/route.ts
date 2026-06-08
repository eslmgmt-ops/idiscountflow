import { NextResponse } from "next/server"
import { canManageSalesPromo } from "@/lib/auth/permissions"
import { getCurrentProfile } from "@/lib/auth/profile"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"
import {
  isSalesPromoAdminRole,
  profileCanAccessSalesPromoTenant,
} from "@/lib/sales-promo/access"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { tenantFilterOrClause } from "@/lib/tenant-data-scope"

type DocumentRow = {
  id: string
  title: string
  created_by: string
  created_at: string
  updated_at: string
  tenant_key?: string
  creator: {
    id: string
    email: string | null
    full_name: string | null
    role: string
  } | null
}

function unwrapCreator(raw: unknown): DocumentRow["creator"] {
  if (!raw || typeof raw !== "object") return null
  const c = Array.isArray(raw) ? (raw[0] as Record<string, unknown> | undefined) : (raw as Record<string, unknown>)
  if (!c || typeof c.id !== "string") return null
  return {
    id: c.id,
    email: typeof c.email === "string" ? c.email : c.email === null ? null : null,
    full_name:
      typeof c.full_name === "string" ? c.full_name : c.full_name === null ? null : null,
    role: typeof c.role === "string" ? c.role : String(c.role ?? ""),
  }
}

function mapDocumentRows(rows: unknown): DocumentRow[] {
  if (!Array.isArray(rows)) return []
  const out: DocumentRow[] = []
  for (const row of rows) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>
    const id = r.id
    const title = r.title
    const created_by = r.created_by
    const created_at = r.created_at
    const updated_at = r.updated_at
    if (
      typeof id !== "string" ||
      typeof title !== "string" ||
      typeof created_by !== "string" ||
      typeof created_at !== "string" ||
      typeof updated_at !== "string"
    ) {
      continue
    }
    out.push({
      id,
      title,
      created_by,
      created_at,
      updated_at,
      tenant_key: typeof r.tenant_key === "string" ? r.tenant_key : undefined,
      creator: unwrapCreator(r.creator),
    })
  }
  return out
}

const DOC_SELECT = `
  id,
  title,
  tenant_key,
  created_by,
  created_at,
  updated_at,
  creator:profiles!sales_promo_documents_created_by_fkey (
    id,
    email,
    full_name,
    role
  )
`

export async function GET(req: Request) {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "SUPABASE_SERVICE_ROLE_KEY is not configured"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  let tenantKey: string
  try {
    tenantKey = resolveTreezTenantForRequest(req, actor).tenantKey
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not resolve store" },
      { status: 400 },
    )
  }

  if (isSalesPromoAdminRole(actor.role)) {
    const { data, error } = await admin
      .from("sales_promo_documents")
      .select(DOC_SELECT)
      .or(tenantFilterOrClause(tenantKey))
      .order("updated_at", { ascending: false })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      documents: mapDocumentRows(data ?? []),
      canManage: true,
      tenantKey,
    })
  }

  if (!profileCanAccessSalesPromoTenant(actor, tenantKey)) {
    return NextResponse.json({
      ok: true,
      documents: [] as DocumentRow[],
      canManage: false,
      tenantKey,
    })
  }

  const { data, error } = await admin
    .from("sales_promo_documents")
    .select(DOC_SELECT)
    .or(tenantFilterOrClause(tenantKey))
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    documents: mapDocumentRows(data ?? []),
    canManage: false,
    tenantKey,
  })
}

export async function POST(request: Request) {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  if (!canManageSalesPromo(actor)) {
    return NextResponse.json(
      { ok: false, error: "Only admins can create promo documents" },
      { status: 403 },
    )
  }

  let tenantKey: string
  try {
    tenantKey = resolveTreezTenantForRequest(request, actor).tenantKey
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not resolve store" },
      { status: 400 },
    )
  }

  let body: { title?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const rawTitle = typeof body.title === "string" ? body.title.trim() : ""
  const title = rawTitle.length > 0 ? rawTitle.slice(0, 200) : "Untitled promo"

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "SUPABASE_SERVICE_ROLE_KEY is not configured"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  const { data: row, error } = await admin
    .from("sales_promo_documents")
    .insert({
      title,
      created_by: actor.id,
      tenant_key: tenantKey,
    })
    .select("id,title,tenant_key,created_by,created_at,updated_at")
    .single()

  if (error || !row) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Insert failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, document: row, tenantKey })
}
