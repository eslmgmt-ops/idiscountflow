import { NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import { listTreezTenants, tenantsForProfile } from "@/lib/treez-tenants"

/** Configured Treez stores the current user may access. */
export async function GET() {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const configured = listTreezTenants()
  const accessible = tenantsForProfile(actor)

  return NextResponse.json({
    ok: true,
    tenants: accessible,
    allConfigured: configured,
  })
}
