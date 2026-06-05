import { createServiceDiscount } from "@/lib/treez"
import { NextResponse } from "next/server"
import { getCurrentProfile } from "@/lib/auth/profile"
import { rejectIfManager } from "@/lib/auth/permissions"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"

export async function POST(request: Request) {
  const actor = await getCurrentProfile()
  const denied = rejectIfManager(actor)
  if (denied) return denied

  try {
    const body = await request.json()
    const { env } = resolveTreezTenantForRequest(request, actor!)
    
    const payload = {
      ...body,
      organizationId: env.orgId,
    }
    
    const result = await createServiceDiscount(env, payload)
    return NextResponse.json(result)
  } catch (e) {
    const err = e as Error & { status?: number; body?: unknown }
    return NextResponse.json(
      { error: err.message, details: err.body },
      { status: err.status || 500 }
    )
  }
}
