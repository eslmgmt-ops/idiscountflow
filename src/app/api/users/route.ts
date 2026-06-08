import { NextResponse } from "next/server"
import { canCreateRole, rejectIfManager } from "@/lib/auth/permissions"
import { getCurrentProfile, normalizeProfileRow } from "@/lib/auth/profile"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { listTreezTenants } from "@/lib/treez-tenants"
import {
  normalizeAndValidateManagerStoreNamesForTenants,
  normalizeTenantKeys,
} from "@/lib/validate-manager-stores"

export async function GET() {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized", me: null }, { status: 401 })
  }
  if (!["master_admin", "admin"].includes(actor.role)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden", me: actor },
      { status: 403 },
    )
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    return NextResponse.json(
      {
        ok: false,
        error: `${msg} Add the service role key in Vercel (or .env.local) to load the full user list.`,
        me: actor,
        users: [],
      },
      { status: 500 },
    )
  }

  const { data: rows, error } = await admin
    .from("profiles")
    .select("id,email,full_name,role,created_at,assigned_tenant_keys,assigned_store_names")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        me: actor,
        users: [],
      },
      { status: 500 },
    )
  }

  const profiles = (rows ?? []).map((r) => normalizeProfileRow(r as Record<string, unknown>))

  return NextResponse.json({
    ok: true,
    me: actor,
    users: profiles,
  })
}

export async function POST(request: Request) {
  const actor = await getCurrentProfile()
  const denied = rejectIfManager(actor)
  if (denied) return denied
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    email?: string
    password?: string
    full_name?: string
    role?: unknown
    assigned_tenant_keys?: unknown
    assigned_store_names?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : ""
  const targetRole = body.role

  if (
    !email ||
    !password ||
    (targetRole !== "admin" && targetRole !== "manager")
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "email, password, and role (admin or manager) are required",
      },
      { status: 400 },
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Password must be at least 6 characters" },
      { status: 400 },
    )
  }

  if (!canCreateRole(actor.role, targetRole)) {
    return NextResponse.json(
      { ok: false, error: "You cannot create users with this role" },
      { status: 403 },
    )
  }

  let assignedTenantKeys: string[] = []
  let assignedNames: string[] = []
  if (targetRole === "manager") {
    const configured = new Set(listTreezTenants().map((t) => t.key))
    const tenantParse = normalizeTenantKeys(body.assigned_tenant_keys, configured)
    if (!tenantParse.ok) {
      return NextResponse.json({ ok: false, error: tenantParse.error }, { status: 400 })
    }
    assignedTenantKeys = tenantParse.keys

    const v = await normalizeAndValidateManagerStoreNamesForTenants(
      body.assigned_store_names,
      assignedTenantKeys,
    )
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 400 })
    }
    assignedNames = v.names
  }

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "SUPABASE_SERVICE_ROLE_KEY is not configured"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (createErr || !created.user) {
    return NextResponse.json(
      { ok: false, error: createErr?.message ?? "Failed to create user" },
      { status: 400 },
    )
  }

  const userId = created.user.id

  const { error: upErr } = await admin
    .from("profiles")
    .update({
      email,
      full_name: full_name || null,
      role: targetRole,
      assigned_tenant_keys: targetRole === "manager" ? assignedTenantKeys : [],
      assigned_store_names: targetRole === "manager" ? assignedNames : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (upErr) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { ok: false, error: upErr.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email,
      full_name: full_name || null,
      role: targetRole,
      assigned_tenant_keys: targetRole === "manager" ? assignedTenantKeys : [],
      assigned_store_names: targetRole === "manager" ? assignedNames : [],
    },
  })
}
