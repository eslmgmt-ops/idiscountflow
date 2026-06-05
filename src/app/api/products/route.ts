import { getCurrentProfile } from "@/lib/auth/profile"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"
import { fetchDispensaryProducts } from "@/lib/treez"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const actor = await getCurrentProfile()
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { env } = resolveTreezTenantForRequest(req, actor)
    const { searchParams } = new URL(req.url)
    const dispensary = searchParams.get("dispensary")

    const result = await fetchDispensaryProducts(env, dispensary || undefined)
    return NextResponse.json(result)
  } catch (e) {
    const err = e as Error & { status?: number; body?: unknown }
    return NextResponse.json(
      { error: err.message, details: err.body },
      { status: err.status || 500 }
    )
  }
}
