"use client"

import * as React from "react"
import type { ProfileRow } from "@/lib/auth/types"
import { Loader2Icon } from "lucide-react"
import { ManagerProfileView } from "@/components/manager-profile-view"
import { UsersManagement } from "@/components/users-management"

export function UsersPageContent() {
  const [role, setRole] = React.useState<ProfileRow["role"] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/session/profile", {
          credentials: "same-origin",
          cache: "no-store",
        })
        const j = (await res.json()) as { ok?: boolean; profile?: ProfileRow | null }
        if (!cancelled && j.ok && j.profile) setRole(j.profile.role)
      } catch {
        /* UsersManagement handles its own auth errors */
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

  if (role === "manager") {
    return <ManagerProfileView />
  }

  return <UsersManagement />
}
