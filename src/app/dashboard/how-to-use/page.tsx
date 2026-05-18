import type { Metadata } from "next"
import { DashboardShell } from "@/components/dashboard-shell"
import { HowToUseGuide } from "@/components/how-to-use-guide"

export const metadata: Metadata = {
  title: "How to use · idiscountflow",
}

export default function HowToUsePage() {
  return (
    <DashboardShell>
      <HowToUseGuide />
    </DashboardShell>
  )
}
