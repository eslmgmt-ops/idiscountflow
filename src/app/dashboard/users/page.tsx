import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard-shell"
import { UsersPageContent } from "@/components/users-page-content"

export const metadata: Metadata = {
  title: "Users · idiscountflow",
}

export default function UsersPage() {
  return (
    <DashboardShell>
      <UsersPageContent />
    </DashboardShell>
  )
}
