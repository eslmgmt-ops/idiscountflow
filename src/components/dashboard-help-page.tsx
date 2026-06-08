"use client"

import type { ReactNode } from "react"
import * as React from "react"
import Link from "next/link"
import type { ProfileRow } from "@/lib/auth/types"
import { ActionTooltip } from "@/components/action-tooltip"
import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileStackIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MailIcon,
  MegaphoneIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  StoreIcon,
  Trash2Icon,
  UserCircleIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Support address — adjust the domain to match your mail host if needed. */
export const SUPPORT_EMAIL = "it@mwgholdings.com"

const PAGE_MAX = "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8"

function GuideLink({
  href,
  children,
  variant = "default",
}: {
  href: string
  children: ReactNode
  variant?: "default" | "outline"
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: variant === "outline" ? "outline" : "default",
          size: "sm",
        }),
        "inline-flex shrink-0 gap-1.5",
      )}
    >
      {children}
      <ArrowUpRightIcon className="size-3.5 opacity-80" aria-hidden />
    </Link>
  )
}

function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3",
        "text-sm leading-relaxed text-foreground",
      )}
      role="note"
    >
      <p className="font-medium text-primary">{title}</p>
      <div className="mt-2 text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </aside>
  )
}

/** Miniature app chrome for help walkthroughs. */
function AppMockup({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
        className,
      )}
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2">
        <span className="size-2.5 rounded-full bg-red-400/80" />
        <span className="size-2.5 rounded-full bg-amber-400/80" />
        <span className="size-2.5 rounded-full bg-emerald-400/80" />
        <span className="text-muted-foreground ms-1 truncate text-[10px] font-medium">{title}</span>
      </div>
      <div className="bg-gradient-to-br from-primary/[0.04] via-background to-background p-3 sm:p-4">
        {children}
      </div>
    </div>
  )
}

function MockSidebarNav({
  active,
}: {
  active: "live" | "drafts" | "draft-item"
}) {
  return (
    <div className="border-border/70 bg-sidebar/80 w-[7.5rem] shrink-0 rounded-lg border p-2 text-[9px] sm:w-[8.5rem] sm:text-[10px]">
      <p className="text-muted-foreground mb-1.5 font-semibold tracking-widest uppercase">Discounts</p>
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1",
          active === "live" && "bg-primary/[0.08] text-foreground",
        )}
      >
        <LayoutGridIcon className="size-3 shrink-0" />
        <span>Live discounts</span>
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-1.5 py-1",
          (active === "drafts" || active === "draft-item") && "bg-primary/[0.08] text-foreground",
        )}
      >
        <FileStackIcon className="size-3 shrink-0" />
        <span>Draft Discounts</span>
      </div>
      {active === "draft-item" ? (
        <div className="border-border/60 mt-1 ms-2 border-l pl-2">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground rounded-md px-1.5 py-0.5 font-medium">
            July PROMOS
          </div>
          <div className="text-muted-foreground mt-0.5 px-1.5 py-0.5">June PROMOS</div>
        </div>
      ) : null}
    </div>
  )
}

function MockHeaderBar() {
  return (
    <div className="border-border/70 mb-3 flex h-8 items-center justify-between rounded-lg border bg-background/90 px-2">
      <span className="bg-muted size-5 rounded-md" />
      <div className="flex items-center gap-1.5">
        <span className="border-border/80 inline-flex h-6 items-center gap-1 rounded-md border bg-background px-1.5 text-[9px]">
          <StoreIcon className="text-primary size-3" />
          Store
          <ChevronDownIcon className="size-2.5 opacity-60" />
        </span>
        <span className="border-border/80 inline-flex size-6 items-center justify-center rounded-md border">
          <SearchIcon className="size-3 opacity-60" />
        </span>
      </div>
    </div>
  )
}

function MockFilterChips() {
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {["Status", "Stores", "Updated"].map((label) => (
        <span
          key={label}
          className="border-border/80 bg-background inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] text-muted-foreground"
        >
          {label}
          <ChevronDownIcon className="size-2.5 opacity-50" />
        </span>
      ))}
    </div>
  )
}

function MockDiscountRow({ title, amount }: { title: string; amount: string }) {
  return (
    <div className="border-border/70 flex items-center justify-between gap-2 rounded-lg border bg-background px-2 py-1.5 text-[9px] sm:text-[10px]">
      <span className="min-w-0 truncate font-medium">{title}</span>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-muted-foreground tabular-nums">{amount}</span>
        <span className="border-border/80 rounded border px-1 py-0.5 text-[8px]">Edit</span>
        <Trash2Icon className="text-destructive size-3" />
      </div>
    </div>
  )
}

function MockDiscountRowReadOnly({ title, amount }: { title: string; amount: string }) {
  return (
    <div className="border-border/70 flex items-center justify-between gap-2 rounded-lg border bg-background px-2 py-1.5 text-[9px] sm:text-[10px]">
      <span className="min-w-0 truncate font-medium">{title}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-muted-foreground tabular-nums">{amount}</span>
        <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase">
          View only
        </span>
      </div>
    </div>
  )
}

function MockManagerSidebarNav({
  active,
  hasSalesPromo,
}: {
  active: "live" | "profile" | "promo" | "help"
  hasSalesPromo: boolean
}) {
  const itemClass = (key: typeof active) =>
    cn(
      "mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1",
      active === key && "bg-primary/[0.08] text-foreground",
    )

  return (
    <div className="border-border/70 bg-sidebar/80 w-[7.5rem] shrink-0 rounded-lg border p-2 text-[9px] sm:w-[8.5rem] sm:text-[10px]">
      <p className="text-muted-foreground mb-1.5 font-semibold tracking-widest uppercase">Discounts</p>
      <div className={itemClass("live")}>
        <LayoutGridIcon className="size-3 shrink-0" />
        <span>Live discounts</span>
      </div>
      <p className="text-muted-foreground mb-1.5 mt-2 font-semibold tracking-widest uppercase">Workspace</p>
      <div className={itemClass("profile")}>
        <UserCircleIcon className="size-3 shrink-0" />
        <span>My profile</span>
      </div>
      {hasSalesPromo ? (
        <div className={itemClass("promo")}>
          <MegaphoneIcon className="size-3 shrink-0" />
          <span>Sales Promo</span>
        </div>
      ) : null}
      <p className="text-muted-foreground mb-1.5 mt-2 font-semibold tracking-widest uppercase">Guides</p>
      <div className={itemClass("help")}>
        <HelpCircleIcon className="size-3 shrink-0" />
        <span>Help</span>
      </div>
      <p className="text-muted-foreground mb-1.5 mt-2 font-semibold tracking-widest uppercase">Session</p>
      <div className="text-muted-foreground mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1">
        <RefreshCwIcon className="size-3 shrink-0" />
        <span>Refresh</span>
      </div>
      <div className="text-muted-foreground flex items-center gap-1.5 rounded-md px-1.5 py-1">
        <LogOutIcon className="size-3 shrink-0" />
        <span>Logout</span>
      </div>
    </div>
  )
}

function ManagerHelpWorkflows({ hasSalesPromo }: { hasSalesPromo: boolean }) {
  return (
    <>
      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Manager guide — view only
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Your account can <strong className="text-foreground">browse</strong> live percent discounts for
            assigned store locations, open <strong className="text-foreground">My profile</strong>
            {hasSalesPromo ? (
              <>
                , and read shared <strong className="text-foreground">Sales Promo</strong> documents
              </>
            ) : null}
            . You cannot edit discounts, use drafts, publish, or manage other users.
          </p>
        </div>

        <Callout title="What you can open">
          <ul className="mt-2 list-disc space-y-1 ps-5 marker:text-primary/70">
            <li>
              <strong>Live discounts</strong> — view-only table for your assigned locations
            </li>
            <li>
              <strong>My profile</strong> — your name, email, store access, and shared promo links
            </li>
            {hasSalesPromo ? (
              <li>
                <strong>Sales Promo</strong> — read-only documents shared with you by an admin
              </li>
            ) : (
              <li>
                <strong>Sales Promo</strong> — appears after an admin shares a document with you
              </li>
            )}
            <li>
              <strong>Help</strong> — this guide and support contact
            </li>
            <li>
              <strong>Refresh</strong> and <strong>Logout</strong> — in the sidebar under Session
            </li>
          </ul>
        </Callout>
      </section>

      <section className="space-y-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              1 — Browse live discounts
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Review active percent offers for stores and locations assigned to your account.
            </p>
          </div>
          <GuideLink href="/dashboard">Open Live discounts</GuideLink>
        </div>

        <AppMockup title="Manager — Live discounts (view only)">
          <div className="flex gap-3">
            <MockManagerSidebarNav active="live" hasSalesPromo={hasSalesPromo} />
            <div className="min-w-0 flex-1">
              <MockHeaderBar />
              <p className="text-muted-foreground mb-2 text-[9px]">
                View only · assigned locations only
              </p>
              <MockFilterChips />
              <div className="space-y-1.5">
                <MockDiscountRowReadOnly title="FUN FRIDAY ON 6 JUN - 20% OFF" amount="20%" />
                <MockDiscountRowReadOnly title="HOTBOX ON 1 JUN TO 7 JUN END - 15% OFF" amount="15%" />
              </div>
            </div>
          </div>
        </AppMockup>

        <ol className="space-y-8">
          <WorkflowStep
            step={1}
            title="Open Live discounts"
            mockup={
              <AppMockup title="Sidebar">
                <MockManagerSidebarNav active="live" hasSalesPromo={hasSalesPromo} />
              </AppMockup>
            }
          >
            <p>
              In the sidebar under <strong>Discounts</strong>, choose <strong>Live discounts</strong>. This is
              your home page after sign-in.
            </p>
          </WorkflowStep>

          <WorkflowStep
            step={2}
            title="Switch store (if you have more than one)"
            mockup={
              <AppMockup title="Header — Switch Company">
                <MockHeaderBar />
                <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">
                  Use the store switcher in the top bar to move between stores assigned to you.
                </p>
              </AppMockup>
            }
          >
            <p>
              If an admin assigned multiple stores, use <strong>Switch Company</strong> in the header. Discounts
              and promo documents are per store.
            </p>
          </WorkflowStep>

          <WorkflowStep
            step={3}
            title="Filter and search"
            mockup={
              <AppMockup title="Filters & search">
                <MockFilterChips />
                <span className="border-border/80 mt-2 inline-flex h-6 w-full items-center gap-1 rounded-md border bg-background px-2 text-[9px] text-muted-foreground">
                  <SearchIcon className="size-3" />
                  Search by title or amount…
                </span>
              </AppMockup>
            }
          >
            <p>
              Use <strong>Status</strong>, <strong>Stores</strong>, and <strong>Updated</strong> to narrow the
              list. Only discounts that include your assigned locations are shown. Search by title or amount when
              needed.
            </p>
          </WorkflowStep>

          <WorkflowStep
            step={4}
            title="Review row details (no edit or delete)"
            mockup={
              <AppMockup title="Read-only row">
                <MockDiscountRowReadOnly title="Selected discount row" amount="20%" />
                <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">
                  No checkboxes, Edit column, or delete actions on manager accounts.
                </p>
              </AppMockup>
            }
          >
            <p>
              Read each row&apos;s title, amount, store locations, and schedule dates. There is no edit panel or
              delete button — contact an admin if a live offer must change.
            </p>
          </WorkflowStep>

          <WorkflowStep
            step={5}
            title="Refresh when you need fresh data"
            mockup={
              <AppMockup title="Sidebar — Session">
                <div className="text-[10px]">
                  <p className="text-muted-foreground mb-2 font-semibold tracking-widest uppercase">Session</p>
                  <div className="text-muted-foreground mb-1 flex items-center gap-1.5 rounded-md bg-primary/[0.06] px-2 py-1.5">
                    <RefreshCwIcon className="size-3.5" />
                    <span>Refresh</span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 rounded-md px-2 py-1.5">
                    <LogOutIcon className="size-3.5" />
                    <span>Logout</span>
                  </div>
                </div>
              </AppMockup>
            }
          >
            <p>
              On Live discounts, use <strong>Refresh</strong> at the bottom of the sidebar to reload from Treez.
              Use <strong>Logout</strong> when you are finished.
            </p>
          </WorkflowStep>
        </ol>
      </section>

      <section className="space-y-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              2 — My profile
            </h3>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              See your account details and which stores, locations, and promo documents you can access.
            </p>
          </div>
          <GuideLink href="/dashboard/users">Open My profile</GuideLink>
        </div>

        <AppMockup title="My profile">
          <div className="flex gap-3">
            <MockManagerSidebarNav active="profile" hasSalesPromo={hasSalesPromo} />
            <div className="min-w-0 flex-1 space-y-2 text-[10px]">
              <p>
                <span className="text-muted-foreground">Name · </span>
                <span className="font-medium">Your name</span>
              </p>
              <p>
                <span className="text-muted-foreground">Role · </span>
                <span className="font-medium">Manager (view only)</span>
              </p>
              <p>
                <span className="text-muted-foreground">Locations · </span>
                <span>Assigned store names</span>
              </p>
              {hasSalesPromo ? (
                <p>
                  <span className="text-muted-foreground">Sales Promo · </span>
                  <span>Shared document links</span>
                </p>
              ) : null}
            </div>
          </div>
        </AppMockup>

        <ol className="space-y-8">
          <WorkflowStep
            step={1}
            title="Open My profile"
            mockup={
              <AppMockup title="Workspace">
                <MockManagerSidebarNav active="profile" hasSalesPromo={hasSalesPromo} />
              </AppMockup>
            }
          >
            <p>
              Under <strong>Workspace → My profile</strong>, review your email, assigned stores, and store
              locations. Ask an admin to update assignments if something looks wrong.
            </p>
          </WorkflowStep>

          <WorkflowStep
            step={2}
            title="Open shared Sales Promo from your profile"
            mockup={
              <AppMockup title="Promo links on profile">
                <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[9px]">
                  <MegaphoneIcon className="size-3" />
                  Summer promo script
                </span>
              </AppMockup>
            }
          >
            <p>
              {hasSalesPromo
                ? "Any Sales Promo documents shared with you appear as links on your profile. Click one to open it in read-only mode."
                : "When an admin shares a promo document, a link will appear here and Sales Promo will show in your sidebar."}
            </p>
          </WorkflowStep>
        </ol>
      </section>

      {hasSalesPromo ? (
        <section className="space-y-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                3 — Sales Promo (read only)
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Read promo scripts and documents an admin shared with your account.
              </p>
            </div>
            <GuideLink href="/dashboard/sales-promo">Open Sales Promo</GuideLink>
          </div>

          <AppMockup title="Sales Promo — view only">
            <div className="flex gap-3">
              <MockManagerSidebarNav active="promo" hasSalesPromo />
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-[10px] font-semibold">Shared promo document</p>
                <div className="border-border/80 bg-muted/25 rounded-lg border px-3 py-4 text-[9px] text-muted-foreground">
                  Document content — read only. No toolbar or save controls.
                </div>
              </div>
            </div>
          </AppMockup>

          <ol className="space-y-8">
            <WorkflowStep
              step={1}
              title="Open Sales Promo"
              mockup={
                <AppMockup title="Sidebar">
                  <MockManagerSidebarNav active="promo" hasSalesPromo />
                </AppMockup>
              }
            >
              <p>
                Choose <strong>Sales Promo</strong> under Workspace, or use a link from My profile. You only
                see documents explicitly shared with you.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={2}
              title="Read the document"
              mockup={
                <AppMockup title="Read-only editor">
                  <div className="border-border/80 bg-muted/30 mb-2 border-b px-2 py-1.5 text-[8px]">
                    View only — ask an admin if changes are needed.
                  </div>
                  <div className="text-muted-foreground px-2 py-6 text-[9px]">Promo content…</div>
                </AppMockup>
              }
            >
              <p>
                Scroll and read the content. You cannot edit, upload images, or rename the document. Contact an
                admin for updates.
              </p>
            </WorkflowStep>
          </ol>
        </section>
      ) : null}

      <Callout title="Need a change?">
        <p>
          Managers cannot edit live discounts, create drafts, publish to Treez, or change user accounts. Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          or ask your administrator.
        </p>
      </Callout>
    </>
  )
}

function MockBulkToolbar({ variant }: { variant: "starter" | "draft" }) {
  if (variant === "starter") {
    return (
      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[9px]">
          <PlusIcon className="size-3" />
          Add Row
        </span>
        <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border border-dashed bg-background px-2 text-[9px]">
          Save draft
        </span>
      </div>
    )
  }
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[9px]">
        <DownloadIcon className="size-3" />
        Import live %
      </span>
      <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-[9px]">
        <PlusIcon className="size-3" />
        Add Row
      </span>
      <span className="border-border/80 inline-flex h-7 items-center gap-1 rounded-md border border-dashed bg-background px-2 text-[9px]">
        Save draft
      </span>
      <span className="inline-flex h-7 items-center gap-1 rounded-md bg-amber-600 px-2 text-[9px] text-white">
        <CheckIcon className="size-3" />
        Publish selected
      </span>
    </div>
  )
}

function MockGridRow({
  typeLabel,
  rowType,
}: {
  typeLabel: string
  rowType?: "existing" | "new"
}) {
  return (
    <div className="border-border/70 grid grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-lg border bg-background p-1.5 text-[8px] sm:grid-cols-[auto_auto_1fr_auto] sm:text-[9px]">
      {rowType ? (
        <Badge
          variant={rowType === "existing" ? "secondary" : "outline"}
          className="h-4 px-1 py-0 text-[7px] font-medium sm:text-[8px]"
        >
          {rowType === "existing" ? "Existing" : "New"}
        </Badge>
      ) : (
        <span className="bg-muted size-3 rounded" />
      )}
      <span className="border-border/80 rounded border px-1 py-0.5 whitespace-nowrap">{typeLabel}</span>
      <span className="text-muted-foreground min-w-0 truncate">FUN FRIDAY ON 6 JUN…</span>
      <span className="text-muted-foreground tabular-nums">20%</span>
    </div>
  )
}

function WorkflowStep({
  step,
  title,
  children,
  mockup,
}: {
  step: number
  title: string
  children: ReactNode
  mockup?: ReactNode
}) {
  return (
    <li className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-2">
        <div className="flex items-start gap-3">
          <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {step}
          </span>
          <div className="min-w-0 space-y-2">
            <h4 className="text-base font-semibold tracking-tight text-foreground">{title}</h4>
            <div className="text-sm leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
              {children}
            </div>
          </div>
        </div>
      </div>
      {mockup ? <div className="min-w-0">{mockup}</div> : null}
    </li>
  )
}

export function DashboardHelpPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("idiscountflow — support request")}`
  const [profile, setProfile] = React.useState<ProfileRow | null>(null)
  const [hasSalesPromo, setHasSalesPromo] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/session/profile", {
          credentials: "same-origin",
          cache: "no-store",
        })
        const j = (await res.json()) as {
          ok?: boolean
          profile?: ProfileRow | null
          sharedSalesPromoDocuments?: { id: string }[]
        }
        if (!cancelled && j.ok && j.profile) {
          setProfile(j.profile)
          setHasSalesPromo((j.sharedSalesPromoDocuments?.length ?? 0) > 0)
        }
      } catch {
        /* non-fatal */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const isManager = profile?.role === "manager"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-primary/10 bg-gradient-to-br from-primary/[0.07] via-background to-background">
        <div className={cn(PAGE_MAX, "flex flex-col gap-6 py-8 md:py-10 lg:py-11")}>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase">
            <LifeBuoyIcon className="size-3.5" aria-hidden />
            Help &amp; support
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-start lg:gap-12">
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                We&apos;re here to help
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px] lg:text-base">
                {isManager
                  ? "View-only guide for browsing live discounts, your profile, and shared Sales Promo documents."
                  : "Questions about discounts, drafts, publishing, or access? Reach the MGWHOLDINGS team by email. Use the guides below for day-to-day workflows in idiscountflow."}
              </p>
            </div>

            <aside className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 shadow-md md:p-6">
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <MailIcon className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact support
                  </p>
                  <p className="break-all text-lg font-semibold tracking-tight text-foreground md:text-xl">
                    <a
                      href={mailto}
                      className="rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We read every message and reply as soon as we can during business hours.
                  </p>
                  <ActionTooltip label={`Copy address or open ${SUPPORT_EMAIL} in your mail app.`} side="top">
                    <a
                      href={mailto}
                      className={cn(
                        buttonVariants({ size: "default" }),
                        "mt-4 inline-flex w-full justify-center gap-2 sm:w-auto",
                      )}
                    >
                      <MailIcon className="size-4" aria-hidden />
                      Email support
                    </a>
                  </ActionTooltip>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className={cn(PAGE_MAX, "flex flex-1 flex-col gap-12 py-8 md:py-10 lg:py-11")}>
        {isManager ? (
          <ManagerHelpWorkflows hasSalesPromo={hasSalesPromo} />
        ) : (
          <>
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              How to use idiscountflow
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Sign in with the credentials your administrator gave you. There are two main workflows: manage
              what is <strong className="text-foreground">live in Treez today</strong>, or prepare a{" "}
              <strong className="text-foreground">new month</strong> in Draft Discounts and publish when you
              are ready.
            </p>
          </div>

          <Callout title="Sign in first">
            <p>
              Open the login page and use your work email and password. If you cannot sign in, ask your
              administrator to create or reset your account on the <strong>Users</strong> page.
            </p>
          </Callout>
        </section>

        <section className="space-y-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Workflow A — Update or remove live discounts
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Use this when you need to change discounts that are already running in Treez right now.
              </p>
            </div>
            <GuideLink href="/dashboard">Open Live discounts</GuideLink>
          </div>

          <AppMockup title="idiscountflow — Live discounts">
            <div className="flex gap-3">
              <MockSidebarNav active="live" />
              <div className="min-w-0 flex-1">
                <MockHeaderBar />
                <p className="mb-2 text-[10px] font-semibold text-foreground sm:text-xs">Percent discounts</p>
                <MockFilterChips />
                <div className="space-y-1.5">
                  <MockDiscountRow title="FUN FRIDAY ON 6 JUN - 20% OFF" amount="20%" />
                  <MockDiscountRow title="HOTBOX ON 1 JUN TO 7 JUN END - 15% OFF" amount="15%" />
                </div>
              </div>
            </div>
          </AppMockup>

          <ol className="space-y-8">
            <WorkflowStep
              step={1}
              title="Open Live discounts"
              mockup={
                <AppMockup title="Sidebar — Discounts">
                  <MockSidebarNav active="live" />
                </AppMockup>
              }
            >
              <p>
                In the sidebar under <strong>Discounts</strong>, choose{" "}
                <strong>Live discounts</strong>. This lists active percent discounts from Treez for your
                selected store.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={2}
              title="Filter to the discount you need"
              mockup={
                <AppMockup title="Filters">
                  <MockFilterChips />
                  <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">
                    Narrow by status, store locations, or the month they were last updated.
                  </p>
                </AppMockup>
              }
            >
              <p>
                Use <strong>Status</strong>, <strong>Stores</strong>, and <strong>Updated</strong> filters to
                find the offer you want. Search by title or amount in the search bar if needed.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={3}
              title="Edit or delete"
              mockup={
                <AppMockup title="Row actions">
                  <MockDiscountRow title="Selected discount row" amount="20%" />
                  <p className="text-muted-foreground mt-2 text-[10px]">
                    Edit opens the side panel. Delete asks for confirmation before removing from Treez.
                  </p>
                </AppMockup>
              }
            >
              <p>
                Open a row to <strong>edit</strong> fields and save back to Treez, or use{" "}
                <strong>delete</strong> to remove it from live discounts. Changes apply to Treez immediately
                — there is no draft step for this workflow.
              </p>
            </WorkflowStep>
          </ol>
        </section>

        <section className="space-y-8 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Workflow B — Plan a new upcoming month (Draft Discounts)
              </h3>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Use this to prepare next month&apos;s promos in a spreadsheet-style draft, import existing
                offers, add or remove rows, then publish everything to Treez when you are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GuideLink href="/dashboard/discounts/drafts">Draft Discounts</GuideLink>
              <GuideLink href="/dashboard/discounts/bulk-upload" variant="outline">
                New bulk sheet
              </GuideLink>
            </div>
          </div>

          <ol className="space-y-10">
            <WorkflowStep
              step={1}
              title="Go to Draft Discounts and start a new sheet"
              mockup={
                <AppMockup title="Draft Discounts list">
                  <div className="flex gap-3">
                    <MockSidebarNav active="drafts" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-[10px] font-semibold">Saved bulk drafts</p>
                      <span className="bg-[#1A1E26] inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] text-white">
                        <PlusIcon className="size-3" />
                        New bulk sheet
                      </span>
                    </div>
                  </div>
                </AppMockup>
              }
            >
              <p>
                Open <strong>Draft Discounts</strong> in the sidebar, then click{" "}
                <strong>New bulk sheet</strong>. This opens the starter page where you name your draft and
                build the first rows.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={2}
              title="Name the draft and add starting rows"
              mockup={
                <AppMockup title="/dashboard/discounts/bulk-upload">
                  <MockHeaderBar />
                  <p className="mb-2 text-[11px] font-semibold">Import database</p>
                  <div className="border-border/80 bg-muted/25 mb-3 rounded-lg border px-2 py-1.5 text-[9px] text-muted-foreground">
                    Save as draft to manage everything — publish, import live, remove rows, and more happen
                    in the draft editor.
                  </div>
                  <p className="text-muted-foreground mb-1 text-[9px]">Draft name</p>
                  <span className="border-border/80 mb-3 inline-block w-full rounded-md border bg-background px-2 py-1 text-[10px]">
                    July PROMOS
                  </span>
                  <MockBulkToolbar variant="starter" />
                  <MockGridRow typeLabel="Fun Friday" />
                </AppMockup>
              }
            >
              <p>
                Enter a <strong>Draft name</strong> (for example &quot;July PROMOS&quot;), use{" "}
                <strong>Add Row</strong> to build your grid, then click <strong>Save draft</strong>. You are
                taken to the full draft editor. Import live, delete, and publish are not on the starter page
                — they open after you save.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={3}
              title="Import live discounts into the draft"
              mockup={
                <AppMockup title="/dashboard/discounts/drafts/[id]">
                  <div className="flex gap-3">
                    <MockSidebarNav active="draft-item" />
                    <div className="min-w-0 flex-1">
                      <MockHeaderBar />
                      <p className="mb-2 text-[11px] font-semibold">Draft bulk discounts</p>
                      <MockBulkToolbar variant="draft" />
                      <div className="space-y-1">
                        <MockGridRow typeLabel="Custom" rowType="existing" />
                        <MockGridRow typeLabel="Hotbox" rowType="existing" />
                        <MockGridRow typeLabel="Fun Friday" rowType="new" />
                      </div>
                    </div>
                  </div>
                </AppMockup>
              }
            >
              <p>
                In the draft editor, click <strong>Import live %</strong> to load all active percent
                discounts from Treez into the table. Imported rows show as{" "}
                <strong>Existing</strong>; new rows you add show as <strong>New</strong>.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={4}
              title="Edit, add, or remove rows — then save"
              mockup={
                <AppMockup title="Draft table actions">
                  <MockBulkToolbar variant="draft" />
                  <div className="space-y-1.5">
                    <MockGridRow typeLabel="Fun Friday" rowType="existing" />
                    <div className="border-amber-500/25 bg-amber-500/10 rounded-lg border px-2 py-1.5 text-[9px] text-amber-950">
                      1 removed live discount will be deleted from Treez when you publish.
                      <span className="ms-2 font-semibold underline">Restore</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2 flex items-center gap-1 text-[9px]">
                    <Trash2Icon className="text-destructive size-3" />
                    Remove existing rows queues them for live delete on publish (with Undo).
                  </p>
                </AppMockup>
              }
            >
              <p>
                Update any cell, <strong>Add Row</strong> for new promos, or remove rows you no longer need.
                Removing an <strong>Existing</strong> row takes it out of the draft only until you publish —
                then it is deleted from live. Use <strong>Undo</strong> or <strong>Restore</strong> if you
                change your mind. Click <strong>Save draft</strong> often so your work is stored.
              </p>
            </WorkflowStep>

            <WorkflowStep
              step={5}
              title="Publish when ready"
              mockup={
                <AppMockup title="Publish">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="border-border/80 inline-flex h-7 items-center rounded-md border bg-background px-2 text-[9px]">
                      Publish all (299)
                    </span>
                    <span className="inline-flex h-7 items-center rounded-md bg-amber-600 px-2 text-[9px] text-white">
                      Publish selected
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-[10px] leading-relaxed">
                    <strong>Existing</strong> rows update the same Treez discount. <strong>New</strong> rows
                    create new discounts. Queued removals delete from live during publish.
                  </p>
                </AppMockup>
              }
            >
              <p>
                When the draft is ready, use <strong>Publish selected</strong> or{" "}
                <strong>Publish all</strong>. Existing rows update Treez; new rows are created; removed
                existing rows are deleted from live. You can publish at any time — there is no requirement to
                finish everything in one session.
              </p>
            </WorkflowStep>
          </ol>

          <Callout title="Quick reference">
            <ul className="mt-2 list-disc space-y-1 ps-5 marker:text-primary/70">
              <li>
                <strong>Live discounts</strong> — immediate edits and deletes in Treez.
              </li>
              <li>
                <strong>New bulk sheet</strong> — start a draft; save to open the full editor.
              </li>
              <li>
                <strong>Draft editor</strong> — import live, edit grid, save, publish, auto-publish schedule.
              </li>
              <li>
                <strong>Company switcher</strong> (header) — drafts and discounts are per store.
              </li>
            </ul>
          </Callout>
        </section>

        <section className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-6 md:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Need more detail?</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Column-level reference and Sales Promo guides live in the extended documentation.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              render={<Link href="/dashboard/how-to-use" />}
            >
              Extended guides
              <ArrowUpRightIcon className="size-3.5" aria-hidden />
            </Button>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  )
}
