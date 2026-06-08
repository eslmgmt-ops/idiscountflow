"use client"

import * as React from "react"
import { canConfigureManagerAccess, canCreateRole, canDeleteUser } from "@/lib/auth/permissions"
import type { AppRole, ProfileRow } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { ActionTooltip } from "@/components/action-tooltip"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"

function roleLabel(r: AppRole): string {
  switch (r) {
    case "master_admin":
      return "Master admin"
    case "admin":
      return "Admin"
    case "manager":
      return "Manager"
    default:
      return r
  }
}

function generateSecurePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  const out: string[] = []
  const buf = new Uint8Array(18)
  crypto.getRandomValues(buf)
  for (let i = 0; i < buf.length; i++) {
    out.push(chars[buf[i]! % chars.length])
  }
  return out.join("")
}

type UsersApiPayload = {
  ok?: boolean
  error?: string
  me?: ProfileRow | null
  users?: ProfileRow[]
}

function parseStoreNamesFromApiPayload(body: unknown): string[] {
  let storesData: unknown = body
  if (storesData && typeof storesData === "object" && !Array.isArray(storesData)) {
    const o = storesData as Record<string, unknown>
    storesData = o.data ?? o.entities ?? o.results ?? []
  }
  if (!Array.isArray(storesData)) return []
  const names = new Set<string>()
  for (const s of storesData) {
    if (!s || typeof s !== "object") continue
    const r = s as Record<string, unknown>
    const name = String(
      r.name ?? r.displayName ?? r.entityName ?? r.organizationEntityName ?? "",
    ).trim()
    if (name) names.add(name)
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export function UsersManagement() {
  const [users, setUsers] = React.useState<ProfileRow[]>([])
  const [me, setMe] = React.useState<ProfileRow | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [userPendingDelete, setUserPendingDelete] = React.useState<ProfileRow | null>(null)

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [role, setRole] = React.useState<"admin" | "manager">("manager")

  const [configuredTenants, setConfiguredTenants] = React.useState<
    { key: string; label: string; dispensary: string }[]
  >([])
  const [orgStoreNames, setOrgStoreNames] = React.useState<string[]>([])
  const [storesLoading, setStoresLoading] = React.useState(false)
  const [storeSearchCreate, setStoreSearchCreate] = React.useState("")
  const [storeSearchEdit, setStoreSearchEdit] = React.useState("")
  const [createTenantSelected, setCreateTenantSelected] = React.useState<Set<string>>(() => new Set())
  const [createStoreSelected, setCreateStoreSelected] = React.useState<Set<string>>(() => new Set())

  const [editOpen, setEditOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<ProfileRow | null>(null)
  const [editEmail, setEditEmail] = React.useState("")
  const [editFullName, setEditFullName] = React.useState("")
  const [editPassword, setEditPassword] = React.useState("")
  const [editTenants, setEditTenants] = React.useState<Set<string>>(() => new Set())
  const [editStores, setEditStores] = React.useState<Set<string>>(() => new Set())
  const [editSaving, setEditSaving] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/users", {
        cache: "no-store",
        credentials: "same-origin",
      })
      const text = await res.text()
      let data: UsersApiPayload
      try {
        data = JSON.parse(text) as UsersApiPayload
      } catch {
        setLoadError(
          `Invalid response (${res.status}). The server may be misconfigured — check Vercel logs.`,
        )
        setMe(null)
        setUsers([])
        return
      }

      if (data.me) {
        setMe(data.me)
      } else {
        setMe(null)
      }

      if (data.ok && Array.isArray(data.users)) {
        setUsers(data.users)
        setLoadError(null)
      } else {
        setUsers(Array.isArray(data.users) ? data.users : [])
        const msg =
          data.error ??
          (res.status === 401
            ? "Please sign in again."
            : "Could not load the user list.")
        setLoadError(msg)
        if (data.me) {
          toast.message("User list unavailable", {
            description: msg.includes("SERVICE_ROLE")
              ? "Add SUPABASE_SERVICE_ROLE_KEY to your deployment to load the table. You can still add users below."
              : msg,
          })
        } else {
          toast.error(msg)
        }
      }
    } catch {
      const msg = "Network error — try again."
      setLoadError(msg)
      setMe(null)
      setUsers([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const loadStoreNamesForTenants = React.useCallback(async (tenantKeys: string[]) => {
    if (tenantKeys.length === 0) {
      setOrgStoreNames([])
      return
    }
    setStoresLoading(true)
    try {
      const names = new Set<string>()
      for (const key of tenantKeys) {
        const storesRes = await fetch(`/api/stores?tenant=${encodeURIComponent(key)}`, {
          credentials: "same-origin",
          cache: "no-store",
        })
        if (storesRes.ok) {
          const raw = await storesRes.json()
          for (const n of parseStoreNamesFromApiPayload(raw)) names.add(n)
        }
      }
      setOrgStoreNames([...names].sort((a, b) => a.localeCompare(b)))
    } catch {
      toast.error("Could not load store locations")
      setOrgStoreNames([])
    } finally {
      setStoresLoading(false)
    }
  }, [])

  const loadCatalogs = React.useCallback(async () => {
    try {
      const tenantsRes = await fetch("/api/tenants", {
        credentials: "same-origin",
        cache: "no-store",
      })
      if (tenantsRes.ok) {
        const tj = (await tenantsRes.json()) as {
          ok?: boolean
          allConfigured?: { key: string; label: string; dispensary: string }[]
        }
        if (tj.ok && Array.isArray(tj.allConfigured)) {
          setConfiguredTenants(tj.allConfigured)
        }
      }
    } catch {
      toast.error("Could not load store list")
    }
  }, [])

  React.useEffect(() => {
    if (me && ["master_admin", "admin"].includes(me.role)) {
      void loadCatalogs()
    }
  }, [me, loadCatalogs])

  React.useEffect(() => {
    if (role !== "manager") {
      setCreateTenantSelected(new Set())
      setCreateStoreSelected(new Set())
    }
  }, [role])

  React.useEffect(() => {
    if (role !== "manager") return
    void loadStoreNamesForTenants([...createTenantSelected].sort((a, b) => a.localeCompare(b)))
  }, [role, createTenantSelected, loadStoreNamesForTenants])

  React.useEffect(() => {
    if (!editOpen || !editTarget) return
    void loadStoreNamesForTenants([...editTenants].sort((a, b) => a.localeCompare(b)))
  }, [editOpen, editTarget, editTenants, loadStoreNamesForTenants])

  const creatableRoles = React.useMemo((): Array<"admin" | "manager"> => {
    if (!me) return []
    const opts: Array<"admin" | "manager"> = []
    if (canCreateRole(me.role, "admin")) opts.push("admin")
    if (canCreateRole(me.role, "manager")) opts.push("manager")
    return opts
  }, [me])

  const canInvite = creatableRoles.length > 0

  const openCreate = () => {
    setEmail("")
    setPassword(generateSecurePassword())
    setFullName("")
    const first = creatableRoles.includes("manager") ? "manager" : "admin"
    setRole(first)
    setCreateTenantSelected(new Set())
    setCreateStoreSelected(new Set())
    setStoreSearchCreate("")
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!me || !email.trim() || !password) {
      toast.error("Email and password are required")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (!canCreateRole(me.role, role)) {
      toast.error("You cannot create users with this role")
      return
    }
    if (role === "manager" && createTenantSelected.size === 0) {
      toast.error("Select at least one store for a manager")
      return
    }
    if (role === "manager" && createStoreSelected.size === 0) {
      toast.error("Select at least one store location for a manager")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
          role,
          assigned_tenant_keys:
            role === "manager" ? Array.from(createTenantSelected).sort((a, b) => a.localeCompare(b)) : undefined,
          assigned_store_names:
            role === "manager" ? Array.from(createStoreSelected).sort((a, b) => a.localeCompare(b)) : undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        toast.error(data.error || "Create failed")
        return
      }
      toast.success("User created", {
        description:
          "They can sign in immediately — no email confirmation required. Share the password securely.",
      })
      setDialogOpen(false)
      void load()
    } catch {
      toast.error("Create failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: ProfileRow) => {
    if (!me) return
    if (!canDeleteUser(me, row)) return
    setDeletingId(row.id)
    try {
      const res = await fetch(`/api/users/${row.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      })
      const data = await res.json()
      if (!data.ok) {
        toast.error(data.error || "Delete failed")
        return
      }
      toast.success("User removed")
      setUserPendingDelete(null)
      void load()
    } catch {
      toast.error("Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const openEditManager = (row: ProfileRow) => {
    if (!me || !canConfigureManagerAccess(me, row)) return
    setEditTarget(row)
    setEditEmail(row.email?.trim() ?? "")
    setEditFullName(row.full_name?.trim() ?? "")
    setEditPassword("")
    setEditTenants(new Set(row.assigned_tenant_keys ?? []))
    setEditStores(new Set(row.assigned_store_names ?? []))
    setStoreSearchEdit("")
    setEditOpen(true)
  }

  const saveEditManager = async () => {
    if (!me || !editTarget) return
    if (!canConfigureManagerAccess(me, editTarget)) return
    if (!editEmail.trim()) {
      toast.error("Email is required")
      return
    }
    if (editPassword.length > 0 && editPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (editTenants.size === 0) {
      toast.error("Select at least one store")
      return
    }
    if (editStores.size === 0) {
      toast.error("Select at least one store location")
      return
    }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editEmail.trim(),
          full_name: editFullName.trim() || null,
          password: editPassword,
          assigned_tenant_keys: Array.from(editTenants).sort((a, b) => a.localeCompare(b)),
          assigned_store_names: Array.from(editStores).sort((a, b) => a.localeCompare(b)),
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Update failed")
        return
      }
      toast.success("Manager updated")
      setEditOpen(false)
      setEditTarget(null)
      void load()
    } catch {
      toast.error("Update failed")
    } finally {
      setEditSaving(false)
    }
  }

  const filteredStoresCreate = React.useMemo(() => {
    const q = storeSearchCreate.trim().toLowerCase()
    if (!q) return orgStoreNames
    return orgStoreNames.filter((n) => n.toLowerCase().includes(q))
  }, [orgStoreNames, storeSearchCreate])

  const filteredStoresEdit = React.useMemo(() => {
    const q = storeSearchEdit.trim().toLowerCase()
    if (!q) return orgStoreNames
    return orgStoreNames.filter((n) => n.toLowerCase().includes(q))
  }, [orgStoreNames, storeSearchEdit])

  if (loading && me === null && !loadError) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2Icon className="size-8 animate-spin" aria-hidden />
      </div>
    )
  }

  if (!me && loadError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-6 lg:p-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Users
        </h1>
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm"
        >
          <p className="font-medium text-destructive">Could not verify your account</p>
          <p className="mt-2 text-muted-foreground">{loadError}</p>
          <ActionTooltip label="Reload the page to retry loading your session." side="top">
            <Button
              type="button"
              variant="outline"
              className="mt-4 gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCwIcon className="size-4" aria-hidden />
              Reload page
            </Button>
          </ActionTooltip>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Users
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Invite teammates with an <strong className="font-medium text-foreground">Admin</strong> or{" "}
            <strong className="font-medium text-foreground">Manager</strong> role. New accounts are{" "}
            <strong className="font-medium text-foreground">confirmed automatically</strong> so they can sign in
            right away. <strong className="font-medium text-foreground">Managers</strong> must be assigned one or
            more store locations and optionally Sales Promo documents; they have a read-only dashboard for those
            stores. Master admin can remove admins and managers; admins can remove managers.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ActionTooltip label="Reload the user list from the server." side="top">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCwIcon className={cn("size-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
          </ActionTooltip>
          {canInvite ? (
            <ActionTooltip label="Create a confirmed Supabase user and send them a temporary password." side="top">
              <Button
                type="button"
                className="gap-2 bg-[#1A1E26] text-white hover:bg-[#1A1E26]/90"
                onClick={openCreate}
              >
                <PlusIcon className="size-4" aria-hidden />
                Add user
              </Button>
            </ActionTooltip>
          ) : null}
        </div>
      </div>

      {loadError && me ? (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Table could not be loaded
          </p>
          <p className="mt-1 text-muted-foreground">{loadError}</p>
          {loadError.includes("SERVICE_ROLE") || loadError.includes("service role") ? (
            <p className="mt-2 text-muted-foreground">
              Add <code className="rounded bg-muted px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              to your Vercel project environment variables and redeploy. You can still use{" "}
              <strong>Add user</strong> below if that key is set for API routes.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border/80">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="min-w-[120px]">Store access</TableHead>
              <TableHead className="min-w-[140px]">Locations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {loadError && me
                    ? "No rows loaded. Fix the error above or add a user."
                    : canInvite
                      ? "No users yet. Click Add user to invite someone."
                      : "No users to show."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const canDel = me ? canDeleteUser(me, u) : false
                const canEditMgr = me ? canConfigureManagerAccess(me, u) : false
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email ?? "—"}</TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          u.role === "master_admin" &&
                            "bg-[#1A1E26]/10 text-[#1A1E26]",
                          u.role === "admin" &&
                            "bg-blue-500/10 text-blue-800 dark:text-blue-300",
                          u.role === "manager" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[160px] text-xs text-muted-foreground">
                      {u.role === "manager" && (u.assigned_tenant_keys?.length ?? 0) > 0 ? (
                        <span className="line-clamp-2" title={u.assigned_tenant_keys!.join(", ")}>
                          {u.assigned_tenant_keys!.join(", ")}
                        </span>
                      ) : u.role === "manager" ? (
                        "—"
                      ) : (
                        <span className="text-muted-foreground/70">all</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-xs text-muted-foreground">
                      {u.role === "manager" && (u.assigned_store_names?.length ?? 0) > 0 ? (
                        <span className="line-clamp-2" title={u.assigned_store_names!.join(", ")}>
                          {u.assigned_store_names!.join(", ")}
                        </span>
                      ) : u.role === "manager" ? (
                        "—"
                      ) : (
                        <span className="text-muted-foreground/70">n/a</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {canEditMgr ? (
                          <ActionTooltip
                            label="Edit email, name, password, store locations, and Sales Promo access."
                            side="left"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-foreground"
                              onClick={() => openEditManager(u)}
                            >
                              <PencilIcon className="size-4" aria-hidden />
                            </Button>
                          </ActionTooltip>
                        ) : null}
                        {canDel ? (
                          <ActionTooltip label={`Remove ${u.email ?? "this user"} from the workspace (irreversible).`} side="left">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === u.id}
                              onClick={() => setUserPendingDelete(u)}
                            >
                              {deletingId === u.id ? (
                                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <Trash2Icon className="size-4" aria-hidden />
                              )}
                            </Button>
                          </ActionTooltip>
                        ) : null}
                        {!canEditMgr && !canDel ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              Creates a Supabase auth account with <strong>email already confirmed</strong>, so they
              can sign in immediately. Send them the temporary password through a secure channel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="new-pass">Temporary password</Label>
                <ActionTooltip label="Fill the password field with a random strong value." side="left">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto gap-1 px-2 py-1 text-xs"
                    onClick={() => {
                      const p = generateSecurePassword()
                      setPassword(p)
                      toast.message("New password generated", {
                        description: "Copy it now — it won’t be shown again after you leave.",
                      })
                    }}
                  >
                    <SparklesIcon className="size-3.5" aria-hidden />
                    Generate
                  </Button>
                </ActionTooltip>
              </div>
              <Input
                id="new-pass"
                type="text"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supabase requires at least 6 characters. User can change password later if you enable
                reset in your Supabase project.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Full name</Label>
              <Input
                id="new-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <select
                id="new-role"
                className={cn(
                  "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm",
                  "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "manager")
                }
              >
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            {role === "manager" ? (
              <>
                <div className="space-y-2 border-t border-border/60 pt-4">
                  <Label>Stores (required)</Label>
                  <p className="text-xs text-muted-foreground">
                    Which Treez store accounts this manager may open after login.
                  </p>
                  <ScrollArea className="h-28 rounded-md border border-border/80 p-2">
                    {configuredTenants.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No stores configured</p>
                    ) : (
                      <div className="space-y-1 pr-2">
                        {configuredTenants.map((t) => (
                          <label
                            key={t.key}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/70"
                          >
                            <Checkbox
                              checked={createTenantSelected.has(t.key)}
                              onCheckedChange={(v) => {
                                setCreateTenantSelected((prev) => {
                                  const next = new Set(prev)
                                  if (v === true) next.add(t.key)
                                  else next.delete(t.key)
                                  return next
                                })
                                setCreateStoreSelected(new Set())
                              }}
                            />
                            <span className="text-sm leading-tight">{t.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Label>Store locations (required)</Label>
                  <p className="text-xs text-muted-foreground">
                    Same list as the discount dashboard location filter. This manager only sees discounts that include
                    at least one of these stores.
                  </p>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-9 pl-9 text-sm"
                      placeholder="Search stores…"
                      value={storeSearchCreate}
                      onChange={(e) => setStoreSearchCreate(e.target.value)}
                      disabled={storesLoading}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={storesLoading}
                      onClick={() => setCreateStoreSelected(new Set(filteredStoresCreate))}
                    >
                      Select visible
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={storesLoading}
                      onClick={() => setCreateStoreSelected(new Set())}
                    >
                      Clear all
                    </Button>
                  </div>
                  <ScrollArea className="h-48 rounded-md border border-border/80 p-2">
                    {storesLoading ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">Loading stores…</p>
                    ) : filteredStoresCreate.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">No stores match</p>
                    ) : (
                      <div className="space-y-1 pr-2">
                        {filteredStoresCreate.map((name) => (
                          <label
                            key={name}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/70"
                          >
                            <Checkbox
                              checked={createStoreSelected.has(name)}
                              onCheckedChange={(v) => {
                                setCreateStoreSelected((prev) => {
                                  const next = new Set(prev)
                                  if (v === true) next.add(name)
                                  else next.delete(name)
                                  return next
                                })
                              }}
                            />
                            <span className="text-sm leading-tight">{name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <p className="text-xs text-muted-foreground">
                  Managers automatically get view-only access to all Sales Promo documents for their assigned
                  stores.
                </p>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <ActionTooltip label="Close without creating a user." side="top">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </ActionTooltip>
            <ActionTooltip label="Create the account with the email, password, and role above." side="top">
              <Button
                type="button"
                className="bg-[#1A1E26] text-white hover:bg-[#1A1E26]/90"
                disabled={saving}
                onClick={() => void handleCreate()}
              >
                {saving ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  "Create user"
                )}
              </Button>
            </ActionTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o)
          if (!o) {
            setEditTarget(null)
            setEditPassword("")
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit manager</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `Update account details and access for ${editTarget.email ?? editTarget.id}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <div className="grid gap-4 py-2">
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Account
                </p>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    autoComplete="off"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full name</Label>
                  <Input
                    id="edit-name"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="edit-pass">New password</Label>
                    <ActionTooltip label="Fill with a random strong password." side="left">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 px-2 py-1 text-xs"
                        onClick={() => {
                          const p = generateSecurePassword()
                          setEditPassword(p)
                          toast.message("Password generated", {
                            description: "Copy it now and share it securely with the user.",
                          })
                        }}
                      >
                        <SparklesIcon className="size-3.5" aria-hidden />
                        Generate
                      </Button>
                    </ActionTooltip>
                  </div>
                  <Input
                    id="edit-pass"
                    type="text"
                    autoComplete="new-password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only admins can set a new password here (minimum 6 characters). Leave empty to leave login
                    unchanged.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stores</Label>
                <ScrollArea className="h-28 rounded-md border border-border/80 p-2">
                  {configuredTenants.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">No stores configured</p>
                  ) : (
                    <div className="space-y-1 pr-2">
                      {configuredTenants.map((t) => (
                        <label
                          key={t.key}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/70"
                        >
                          <Checkbox
                            checked={editTenants.has(t.key)}
                            onCheckedChange={(v) => {
                              setEditTenants((prev) => {
                                const next = new Set(prev)
                                if (v === true) next.add(t.key)
                                else next.delete(t.key)
                                return next
                              })
                              setEditStores(new Set())
                            }}
                          />
                          <span className="text-sm leading-tight">{t.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <div className="space-y-2">
                <Label>Store locations</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-9 pl-9 text-sm"
                    placeholder="Search stores…"
                    value={storeSearchEdit}
                    onChange={(e) => setStoreSearchEdit(e.target.value)}
                    disabled={storesLoading}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={storesLoading}
                    onClick={() => setEditStores(new Set(filteredStoresEdit))}
                  >
                    Select visible
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={storesLoading}
                    onClick={() => setEditStores(new Set())}
                  >
                    Clear all
                  </Button>
                </div>
                <ScrollArea className="h-48 rounded-md border border-border/80 p-2">
                  {storesLoading ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">Loading stores…</p>
                  ) : filteredStoresEdit.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">No stores match</p>
                  ) : (
                    <div className="space-y-1 pr-2">
                      {filteredStoresEdit.map((name) => (
                        <label
                          key={name}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/70"
                        >
                          <Checkbox
                            checked={editStores.has(name)}
                            onCheckedChange={(v) => {
                              setEditStores((prev) => {
                                const next = new Set(prev)
                                if (v === true) next.add(name)
                                else next.delete(name)
                                return next
                              })
                            }}
                          />
                          <span className="text-sm leading-tight">{name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              <p className="text-xs text-muted-foreground">
                Sales Promo access follows store assignment — all promo documents for assigned stores are
                available in view-only mode.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#1A1E26] text-white hover:bg-[#1A1E26]/90"
              disabled={editSaving || !editTarget}
              onClick={() => void saveEditManager()}
            >
              {editSaving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={userPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setUserPendingDelete(null)
        }}
        title="Remove user?"
        description={
          userPendingDelete ? (
            <>
              Remove access for{" "}
              <span className="font-medium text-foreground">
                {userPendingDelete.email ?? userPendingDelete.id}
              </span>
              ? This permanently removes them from the workspace and cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Remove user"
        cancelLabel="Cancel"
        variant="destructive"
        isWorking={deletingId !== null && userPendingDelete !== null}
        onConfirm={() => {
          if (userPendingDelete) void handleDelete(userPendingDelete)
        }}
      />
    </div>
  )
}
