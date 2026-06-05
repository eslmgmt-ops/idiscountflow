import { TenantSessionProvider } from "@/components/tenant-session-provider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <TenantSessionProvider>{children}</TenantSessionProvider>
}
