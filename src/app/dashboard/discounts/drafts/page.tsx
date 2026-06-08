"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ActionTooltip } from "@/components/action-tooltip"
import { Button } from "@/components/ui/button"
import {
  ArrowLeftIcon,
  DownloadIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { exportActivePercentDiscountsToBulkRows } from "@/lib/bulk-discount-from-treez"
import {
  type ProductCollection,
  serializeDraftStorage,
  type StoreEntity,
} from "@/lib/bulk-discount-io"
import { useReloadOnTenantChange } from "@/lib/use-tenant-session"
import { toast } from "sonner"

type DraftListItem = {
  id: string
  title: string
  created_at: string
  updated_at: string
  rowCount?: number
}

export default function DiscountDraftsListPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [drafts, setDrafts] = React.useState<DraftListItem[]>([])
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [importingDraft, setImportingDraft] = React.useState(false)
  const [draftPendingDelete, setDraftPendingDelete] = React.useState<{
    id: string
    title: string
  } | null>(null)

  const loadDrafts = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/discount-drafts", {
        credentials: "same-origin",
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load drafts")
      setDrafts(Array.isArray(data.drafts) ? data.drafts : [])
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadDrafts()
  }, [loadDrafts])

  useReloadOnTenantChange(() => {
    void loadDrafts()
  })

  async function handleDraftImport() {
    setImportingDraft(true)
    try {
      const [discountsRes, storesRes, collectionsRes] = await Promise.all([
        fetch("/api/discounts", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/stores", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/collections", { credentials: "same-origin", cache: "no-store" }),
      ])

      const discountsData = await discountsRes.json()
      if (!discountsData.ok) {
        throw new Error(
          typeof discountsData.error === "string"
            ? discountsData.error
            : "Failed to load discounts",
        )
      }

      const storesData = storesRes.ok ? await storesRes.json() : null
      const storesArray = storesData?.data || storesData?.entities || storesData
      const stores: StoreEntity[] = Array.isArray(storesArray)
        ? storesArray.map((s: Record<string, unknown>) => ({
            id: String(
              s.id ?? s.entityId ?? s.organizationEntityId ?? s,
            ),
            name: String(
              s.name ??
                s.displayName ??
                s.entityName ??
                s.organizationEntityName ??
                s.id ??
                s,
            ),
          }))
        : []

      const collectionsData = collectionsRes.ok ? await collectionsRes.json() : null
      const collectionsArray =
        collectionsData?.data || collectionsData?.collections || collectionsData
      const collections: ProductCollection[] = Array.isArray(collectionsArray)
        ? collectionsArray.map((c: Record<string, unknown>) => ({
            id: String(c.id ?? c.collectionId ?? c.productCollectionId ?? c),
            name: String(c.name ?? c.title ?? c.displayName ?? c.id ?? c),
          }))
        : []

      const treezRows: Record<string, unknown>[] = Array.isArray(discountsData.rows)
        ? discountsData.rows
        : []
      const mapped = exportActivePercentDiscountsToBulkRows(treezRows, stores, collections)
      if (mapped.length === 0) {
        toast.message("No active percent discounts found", {
          description:
            "Only isActive=true and method PERCENT discounts are imported, same as Import live %.",
        })
        return
      }

      const title = `Live import ${new Date().toLocaleDateString()}`
      const res = await fetch("/api/discount-drafts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          rows: serializeDraftStorage(mapped, []),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create draft")

      const id = data.draft?.id as string | undefined
      if (!id) throw new Error("Draft created but no id returned")

      toast.success(`Imported ${mapped.length} discount${mapped.length === 1 ? "" : "s"}`, {
        description: "Opening draft editor…",
      })
      window.dispatchEvent(new CustomEvent("bulk-drafts-changed"))
      router.push(`/dashboard/discounts/drafts/${id}`)
    } catch (e) {
      toast.error("Could not import discounts", { description: (e as Error).message })
    } finally {
      setImportingDraft(false)
    }
  }

  async function confirmDeleteDraft() {
    if (!draftPendingDelete) return
    const { id } = draftPendingDelete
    setDeletingId(id)
    try {
      const res = await fetch(`/api/discount-drafts/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error || "Failed to delete draft")
      setDrafts((prev) => prev.filter((d) => d.id !== id))
      toast.success("Draft deleted")
      setDraftPendingDelete(null)
      window.dispatchEvent(new CustomEvent("bulk-drafts-changed"))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DashboardShell
      headerActions={
        <ActionTooltip label="Return to the discount dashboard." side="bottom">
          <Button
            type="button"
            variant="ghost"
            className="gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
        </ActionTooltip>
      }
    >
      <div className="flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-8 lg:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Saved bulk drafts
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a draft to edit the same table as bulk create, publish to Treez, or set one
              auto-publish day for all unpublished rows (cron).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionTooltip label="Open a blank bulk sheet to build new discounts." side="top">
              <Button
                type="button"
                className="gap-2 bg-[#1A1E26] text-white hover:bg-[#1A1E26]/90"
                render={<Link href="/dashboard/discounts/bulk-upload" prefetch />}
              >
                <PlusIcon className="size-4" />
                Draft blank
              </Button>
            </ActionTooltip>
            <ActionTooltip
              label="Create a new draft from all active percent discounts currently live in Treez."
              side="top"
            >
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={importingDraft}
                onClick={() => void handleDraftImport()}
              >
                {importingDraft ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    <DownloadIcon className="size-4" />
                    Draft import
                  </>
                )}
              </Button>
            </ActionTooltip>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rows
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Updated
                  </th>
                  <th className="min-w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      <Loader2Icon className="mr-2 inline size-4 animate-spin" />
                      Loading drafts…
                    </td>
                  </tr>
                ) : drafts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No drafts yet. Use &quot;Save draft&quot; on bulk create.
                    </td>
                  </tr>
                ) : (
                  drafts.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{d.title}</td>
                      <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                        {d.rowCount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                        {d.updated_at ? new Date(d.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <ActionTooltip label={`Open “${d.title}” in the bulk draft editor.`} side="left">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              render={<Link href={`/dashboard/discounts/drafts/${d.id}`} prefetch />}
                              disabled={deletingId === d.id}
                            >
                              <PencilIcon className="size-3.5" />
                              Edit
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip
                            label={`Permanently delete “${d.title}” from the server.`}
                            side="left"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === d.id}
                              onClick={() =>
                                setDraftPendingDelete({ id: d.id, title: d.title })
                              }
                            >
                              {deletingId === d.id ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2Icon className="size-3.5" />
                              )}
                              Delete
                            </Button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={draftPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDraftPendingDelete(null)
        }}
        title="Delete draft?"
        description={
          draftPendingDelete ? (
            <>
              Delete draft &ldquo;{draftPendingDelete.title}&rdquo;? This removes it from the server and
              cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isWorking={deletingId !== null && draftPendingDelete !== null}
        onConfirm={() => void confirmDeleteDraft()}
      />
    </DashboardShell>
  )
}
