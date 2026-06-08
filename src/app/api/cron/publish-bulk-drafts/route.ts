/**
 * Intended for Vercel Cron or any scheduler: publishes bulk draft rows whose
 * `scheduledPublishDate` + `scheduledPublishTime` (PST/PDT) is due and not yet published.
 *
 * Set env CRON_SECRET and send: Authorization: Bearer <CRON_SECRET>
 */
import { NextResponse } from "next/server"
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
} from "@/lib/bulk-discount-io"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { getDefaultTenantKey, LEGACY_TENANT_KEY } from "@/lib/tenant-data-scope"
import { getTreezEnvForTenant } from "@/lib/treez-tenants"
import { isAutoPublishDue } from "@/lib/auto-publish-pst"
import { createServiceDiscount, updateServiceDiscount } from "@/lib/treez"

const BETWEEN_TREEZ_MS = 150

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 501 })
  }

  const auth = request.headers.get("authorization")?.trim()
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  const { data: drafts, error: listErr } = await admin
    .from("bulk_discount_drafts")
    .select("id,rows,tenant_key")

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  let publishedCount = 0
  const details: { draftId: string; rowId: string; title: string; error?: string }[] = []
  let treezDelay = false

  const defaultTenantKey = getDefaultTenantKey()

  for (const d of drafts ?? []) {
    if (!d?.id) continue

    const rawTenant = String(d.tenant_key ?? LEGACY_TENANT_KEY).trim().toLowerCase()
    const tenantKey =
      rawTenant || defaultTenantKey || ""
    if (!tenantKey) {
      details.push({
        draftId: d.id,
        rowId: "(draft)",
        title: "(draft)",
        error: "Draft has no tenant_key and no default store is configured",
      })
      continue
    }

    let env
    try {
      env = getTreezEnvForTenant(tenantKey)
    } catch (e) {
      details.push({
        draftId: d.id,
        rowId: "(draft)",
        title: "(draft)",
        error: e instanceof Error ? e.message : `Treez env missing for store ${tenantKey}`,
      })
      continue
    }

    const parsedDraft = parseDraftStorage(d.rows)
    let rows = parsedDraft.rows
    const pendingTreezDeletes = parsedDraft.pendingTreezDeletes
    rows = rows.map((r) => recomputeRowMeta(r))
    let changed = false

    for (const row of rows) {
      if (row.publishedAt) continue
      if (!isAutoPublishDue(row.scheduledPublishDate, row.scheduledPublishTime)) continue
      const v = validateBulkRow(row)
      if (!v.isValid) {
        details.push({
          draftId: d.id,
          rowId: row.id,
          title: row.title,
          error: v.error ?? "Invalid row",
        })
        continue
      }

      const tid = (row.treezDiscountId ?? "").trim()

      if (treezDelay) await delay(BETWEEN_TREEZ_MS)
      treezDelay = true

      if (tid) {
        try {
          const putPayload = buildTreezPutPayloadFromBulkRow(row, tid)
          if (putPayload.organizationId == null) putPayload.organizationId = env.orgId
          const putResBody = await updateServiceDiscount(env, putPayload)
          const ts = new Date().toISOString()
          const nextBase = snapshotForTreezPutBase(putResBody)
          rows = rows.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  publishedAt: ts,
                  publishError: null,
                  treezDiscountId: tid,
                  treezPutBase: nextBase ?? r.treezPutBase,
                }
              : r,
          )
          publishedCount += 1
          changed = true
          details.push({ draftId: d.id, rowId: row.id, title: row.title })
        } catch (e) {
          const msg = (e as Error).message || "Update failed"
          rows = rows.map((r) =>
            r.id === row.id ? { ...r, publishError: msg } : r,
          )
          changed = true
          details.push({ draftId: d.id, rowId: row.id, title: row.title, error: msg })
        }
        continue
      }

      const [payload] = buildTreezPayloadsFromBulkRows([row]).map((p) => ({
        ...p,
        organizationId: env.orgId,
      }))

      try {
        const bodyJson = await createServiceDiscount(env, payload)
        const ts = new Date().toISOString()
        const newId = extractTreezDiscountIdFromResponse(bodyJson)
        const nextBase = snapshotForTreezPutBase(bodyJson)
        rows = rows.map((r) =>
          r.id === row.id
            ? {
                ...r,
                publishedAt: ts,
                publishError: null,
                treezDiscountId: newId || r.treezDiscountId,
                treezPutBase: nextBase ?? r.treezPutBase,
              }
            : r,
        )
        publishedCount += 1
        changed = true
        details.push({ draftId: d.id, rowId: row.id, title: row.title })
      } catch (e) {
        const msg = (e as Error).message || "Create failed"
        rows = rows.map((r) =>
          r.id === row.id ? { ...r, publishError: msg } : r,
        )
        changed = true
        details.push({ draftId: d.id, rowId: row.id, title: row.title, error: msg })
      }
    }

    if (isBulkDraftFullyPublished(rows) && pendingTreezDeletes.length === 0) {
      await admin.from("bulk_discount_drafts").delete().eq("id", d.id)
    } else if (changed) {
      await admin
        .from("bulk_discount_drafts")
        .update({
          rows: serializeDraftStorage(rows, pendingTreezDeletes),
          updated_at: new Date().toISOString(),
        })
        .eq("id", d.id)
    }
  }

  return NextResponse.json({
    ok: true,
    publishedRows: publishedCount,
    details,
  })
}
