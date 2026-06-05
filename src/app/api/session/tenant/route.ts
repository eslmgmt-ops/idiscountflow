import { NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import {
  resolveTreezTenantForProfile,
  TREEZ_TENANT_COOKIE,
} from "@/lib/resolve-treez-tenant"
import { listTreezTenants, tenantsForProfile } from "@/lib/treez-tenants"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/** List accessible stores and the active tenant (from cookie / query). */
export async function GET(req: Request) {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let configured: ReturnType<typeof listTreezTenants>
  try {
    configured = listTreezTenants()
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Treez configuration error",
        tenants: [],
        currentTenantKey: null,
      },
      { status: 500 },
    )
  }

  const tenants = tenantsForProfile(actor)

  if (configured.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "No Treez stores configured. Set TREEZ_ORG_ID, TREEZ_DISPENSARY, and optionally TREEZ_TENANTS.",
      tenants: [],
      currentTenantKey: null,
    }, { status: 500 })
  }

  if (tenants.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "No store access assigned. Contact an admin.",
      tenants: [],
      currentTenantKey: null,
    }, { status: 403 })
  }

  try {
    const url = new URL(req.url)
    const requested = url.searchParams.get("tenant") ?? undefined
    const resolved = resolveTreezTenantForProfile(actor, requested)
    return NextResponse.json({
      ok: true,
      tenants,
      currentTenantKey: resolved.tenantKey,
      currentTenant: resolved.tenant,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Could not resolve store",
      tenants,
      currentTenantKey: null,
    }, { status: 400 })
  }
}

/** Persist the user's selected store (HTTP-only cookie). */
export async function POST(request: Request) {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  let body: { tenantKey?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const tenantKey =
    typeof body.tenantKey === "string" ? body.tenantKey.trim().toLowerCase() : ""
  if (!tenantKey) {
    return NextResponse.json({ ok: false, error: "tenantKey is required" }, { status: 400 })
  }

  try {
    const resolved = resolveTreezTenantForProfile(actor, tenantKey)
    const res = NextResponse.json({
      ok: true,
      currentTenantKey: resolved.tenantKey,
      currentTenant: resolved.tenant,
    })
    res.cookies.set(TREEZ_TENANT_COOKIE, resolved.tenantKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    })
    return res
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid store" },
      { status: 403 },
    )
  }
}
