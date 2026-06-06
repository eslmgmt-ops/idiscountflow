import { NextResponse } from "next/server"
import { rejectIfManager } from "@/lib/auth/permissions"
import { getCurrentProfile } from "@/lib/auth/profile"
import { buildTreezPayloadsFromBulkRows } from "@/lib/bulk-discount-payload"
import {
  buildTreezPutPayloadFromBulkRow,
  extractTreezDiscountIdFromResponse,
  snapshotForTreezPutBase,
} from "@/lib/bulk-discount-treez-put"
import {
  isBulkDraftFullyPublished,
  parseDraftStorage,
  recomputeRowMeta,
  serializeDraftStorage,
  validateBulkRow,
  type BulkDiscountRow,
} from "@/lib/bulk-discount-io"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { resolveTreezTenantForRequest } from "@/lib/resolve-treez-tenant"
import { rowMatchesTenant } from "@/lib/tenant-data-scope"
import {
  createServiceDiscount,
  deleteServiceDiscountOrFallback,
  updateServiceDiscount,
} from "@/lib/treez"

const BETWEEN_TREEZ_MS = 150

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getCurrentProfile()
  const denied = rejectIfManager(actor)
  if (denied) return denied
  const uid = actor!.id

  let admin
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Supabase admin not configured" },
      { status: 500 },
    )
  }

  const { id: draftId } = await params

  let tenantKey: string
  try {
    tenantKey = resolveTreezTenantForRequest(request, actor!).tenantKey
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not resolve store" },
      { status: 400 },
    )
  }

  const { data: draftRow, error: fetchErr } = await admin
    .from("bulk_discount_drafts")
    .select("id,created_by,rows,title,tenant_key")
    .eq("id", draftId)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (
    !draftRow ||
    draftRow.created_by !== uid ||
    !rowMatchesTenant(draftRow.tenant_key as string | null, tenantKey)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: { rowIds?: unknown }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const rowIdsRaw = body.rowIds
  const filterIds = Array.isArray(rowIdsRaw)
    ? rowIdsRaw.length > 0
      ? new Set(rowIdsRaw.filter((x): x is string => typeof x === "string"))
      : new Set<string>()
    : null

  const parsedDraft = parseDraftStorage(draftRow.rows)
  let rows = parsedDraft.rows
  let pendingTreezDeletes = parsedDraft.pendingTreezDeletes
  rows = rows.map((r) => recomputeRowMeta(r))

  type Op = "create" | "update" | "delete"
  const toProcess: { row: BulkDiscountRow; op: Exclude<Op, "delete"> }[] = []
  const skipped: { title: string; ok: false; error: string; op: "skip" }[] = []

  for (const row of rows) {
    if (filterIds && !filterIds.has(row.id)) continue
    const v = validateBulkRow(row)
    if (!v.isValid) continue

    const published = !!(row.publishedAt && String(row.publishedAt).trim())
    const tid = (row.treezDiscountId ?? "").trim()

    if (published && !tid) {
      skipped.push({
        title: row.title,
        ok: false,
        op: "skip",
        error:
          "Cannot sync: row is marked live but has no Treez id. Re-import from live discounts or publish from a fresh row.",
      })
      continue
    }

    toProcess.push({ row, op: tid ? "update" : "create" })
  }

  const liveRowTreezIds = new Set(
    rows.map((r) => (r.treezDiscountId ?? "").trim()).filter(Boolean),
  )
  const deletesToProcess = pendingTreezDeletes.filter(
    (p) => p.treezDiscountId && !liveRowTreezIds.has(p.treezDiscountId),
  )

  if (toProcess.length === 0 && deletesToProcess.length === 0) {
    return NextResponse.json(
      {
        error: "No eligible rows to publish (must be valid; legacy live rows need a Treez id to update).",
        published: 0,
        deleted: 0,
        skipped,
      },
      { status: 400 },
    )
  }

  let env
  try {
    env = resolveTreezTenantForRequest(request, actor!).env
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Treez env missing" },
      { status: 500 },
    )
  }

  const results: { title: string; ok: boolean; error?: string; op: Op | "skip" }[] = [...skipped]
  let remainingPendingDeletes = [...pendingTreezDeletes]

  for (let i = 0; i < deletesToProcess.length; i++) {
    if (i > 0) await delay(BETWEEN_TREEZ_MS)
    const pending = deletesToProcess[i]!
    const label = pending.title?.trim() || pending.treezDiscountId
    try {
      const { outcome } = await deleteServiceDiscountOrFallback(env, pending.treezDiscountId)
      results.push({
        title: label,
        ok: true,
        op: "delete",
        error:
          outcome === "deactivated"
            ? "Deactivated in Treez (hard delete not permitted for this discount)."
            : undefined,
      })
      remainingPendingDeletes = remainingPendingDeletes.filter(
        (p) => p.treezDiscountId !== pending.treezDiscountId,
      )
    } catch (e) {
      const err = e as Error & { message?: string }
      const msg = err.message || "Delete failed"
      results.push({ title: label, ok: false, error: msg, op: "delete" })
    }
  }

  pendingTreezDeletes = remainingPendingDeletes

  if (toProcess.length === 0) {
    const { error: saveErr } = await admin
      .from("bulk_discount_drafts")
      .update({
        rows: serializeDraftStorage(rows, pendingTreezDeletes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", draftId)

    if (saveErr) {
      return NextResponse.json(
        { error: saveErr.message, partialResults: results },
        { status: 500 },
      )
    }

    const okCount = results.filter((r) => r.ok).length
    const deleted = results.filter((r) => r.ok && r.op === "delete").length
    return NextResponse.json({
      ok: true,
      published: okCount,
      created: 0,
      updated: 0,
      deleted,
      total: results.length,
      results,
      draftRemoved: false,
    })
  }

  if (toProcess.length > 0 && deletesToProcess.length > 0) {
    await delay(BETWEEN_TREEZ_MS)
  }

  for (let i = 0; i < toProcess.length; i++) {
    if (i > 0) await delay(BETWEEN_TREEZ_MS)
    const { row: brQueued, op } = toProcess[i]
    const br = rows.find((r) => r.id === brQueued.id) ?? brQueued

    if (op === "update") {
      const tid = (br.treezDiscountId ?? "").trim()
      try {
        const putPayload = buildTreezPutPayloadFromBulkRow(br, tid)
        if (putPayload.organizationId == null) putPayload.organizationId = env.orgId
        const putResBody = await updateServiceDiscount(env, putPayload)
        results.push({ title: br.title, ok: true, op: "update" })
        const ts = new Date().toISOString()
        const nextBase = snapshotForTreezPutBase(putResBody)
        rows = rows.map((r) =>
          r.id === br.id
            ? {
                ...r,
                publishedAt: ts,
                publishError: null,
                treezDiscountId: tid,
                treezPutBase: nextBase ?? r.treezPutBase,
              }
            : r,
        )
      } catch (e) {
        const err = e as Error & { message?: string }
        const msg = err.message || "Update failed"
        results.push({ title: br.title, ok: false, error: msg, op: "update" })
        rows = rows.map((r) => (r.id === br.id ? { ...r, publishError: msg } : r))
      }
      continue
    }

    const payloads = buildTreezPayloadsFromBulkRows([br]).map((p) => ({
      ...p,
      organizationId: env.orgId,
    }))
    const payload = payloads[0]
    try {
      const bodyJson = await createServiceDiscount(env, payload)
      results.push({ title: br.title, ok: true, op: "create" })
      const ts = new Date().toISOString()
      const newId = extractTreezDiscountIdFromResponse(bodyJson)
      const nextBase = snapshotForTreezPutBase(bodyJson)
      rows = rows.map((r) =>
        r.id === br.id
          ? {
              ...r,
              publishedAt: ts,
              publishError: null,
              treezDiscountId: newId || r.treezDiscountId,
              treezPutBase: nextBase ?? r.treezPutBase,
            }
          : r,
      )
    } catch (e) {
      const err = e as Error & { message?: string }
      const msg = err.message || "Create failed"
      results.push({ title: br.title, ok: false, error: msg, op: "create" })
      rows = rows.map((r) => (r.id === br.id ? { ...r, publishError: msg } : r))
    }
  }

  const fullyPublished =
    isBulkDraftFullyPublished(rows) && pendingTreezDeletes.length === 0
  const { error: saveErr } = fullyPublished
    ? await admin.from("bulk_discount_drafts").delete().eq("id", draftId)
    : await admin
        .from("bulk_discount_drafts")
        .update({
          rows: serializeDraftStorage(rows, pendingTreezDeletes),
          updated_at: new Date().toISOString(),
        })
        .eq("id", draftId)

  if (saveErr) {
    return NextResponse.json(
      { error: saveErr.message, partialResults: results },
      { status: 500 },
    )
  }

  const okCount = results.filter((r) => r.ok).length
  const created = results.filter((r) => r.ok && r.op === "create").length
  const updated = results.filter((r) => r.ok && r.op === "update").length
  const deleted = results.filter((r) => r.ok && r.op === "delete").length
  return NextResponse.json({
    ok: true,
    published: okCount,
    created,
    updated,
    deleted,
    total: results.length,
    results,
    draftRemoved: fullyPublished,
  })
}
