"use client"

import * as React from "react"
import Link from "next/link"
import type { ProfileRow } from "@/lib/auth/types"
import type { SharedSalesPromoDoc } from "@/lib/manager-promo-shares"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Loader2Icon, MegaphoneIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type SessionProfilePayload = {
  ok?: boolean
  error?: string
  profile?: ProfileRow | null
  tenants?: { key: string; label: string; dispensary: string }[]
  sharedSalesPromoDocuments?: SharedSalesPromoDoc[]
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function ManagerProfileView() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [profile, setProfile] = React.useState<ProfileRow | null>(null)
  const [tenants, setTenants] = React.useState<SessionProfilePayload["tenants"]>([])
  const [promoDocs, setPromoDocs] = React.useState<SharedSalesPromoDoc[]>([])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/session/profile", {
          credentials: "same-origin",
          cache: "no-store",
        })
        const data = (await res.json()) as SessionProfilePayload
        if (!res.ok || !data.ok || !data.profile) {
          if (!cancelled) {
            setError(data.error ?? "Could not load your profile")
            setProfile(null)
          }
          return
        }
        if (!cancelled) {
          setProfile(data.profile)
          setTenants(data.tenants ?? [])
          setPromoDocs(data.sharedSalesPromoDocuments ?? [])
        }
      } catch {
        if (!cancelled) {
          setError("Network error — try again.")
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    )
  }

  if (!profile || error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-6 lg:p-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          My profile
        </h1>
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm text-destructive"
        >
          {error ?? "Could not load your profile"}
        </div>
      </div>
    )
  }

  const storeLabels =
    tenants?.map((t) => t.label).filter(Boolean) ??
    profile.assigned_tenant_keys

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            My profile
          </h1>
          <Badge variant="secondary" className="text-[10px] font-semibold tracking-wide uppercase">
            View only
          </Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Your account details and store access. Contact an administrator if any assignment needs to change.
        </p>
      </div>

      <div className="grid max-w-3xl gap-6 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
        <Field label="Name">
          {profile.full_name?.trim() || <span className="text-muted-foreground">Not set</span>}
        </Field>
        <Field label="Email">
          {profile.email?.trim() || <span className="text-muted-foreground">Not set</span>}
        </Field>
        <Field label="Role">
          <span className="inline-flex items-center gap-2">
            Manager
            <span className="text-muted-foreground text-xs">— view-only live discounts</span>
          </span>
        </Field>
        <Field label="Assigned stores">
          {storeLabels.length > 0 ? (
            <ul className="list-inside list-disc space-y-0.5 text-sm">
              {storeLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : (
            <span className="text-amber-800 dark:text-amber-200">
              No stores assigned yet. Ask an admin to assign store access.
            </span>
          )}
        </Field>
        <Field label="Store locations">
          {profile.assigned_store_names.length > 0 ? (
            <p>{profile.assigned_store_names.join(", ")}</p>
          ) : (
            <span className="text-amber-800 dark:text-amber-200">
              No locations assigned yet. Live discounts will appear after an admin assigns locations.
            </span>
          )}
        </Field>
        <Field label="Sales Promo access">
          {promoDocs.length > 0 ? (
            <ul className="space-y-2">
              {promoDocs.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/dashboard/sales-promo/${doc.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "inline-flex gap-2",
                    )}
                  >
                    <MegaphoneIcon className="size-3.5" aria-hidden />
                    {doc.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">
              No promo documents for your assigned stores yet. Documents appear here when an admin creates
              them for your company.
            </span>
          )}
        </Field>
      </div>
    </div>
  )
}
