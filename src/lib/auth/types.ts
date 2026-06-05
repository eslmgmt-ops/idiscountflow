export type AppRole = "master_admin" | "admin" | "manager"

export type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: AppRole
  created_at: string
  /** Treez store tenant keys; meaningful for managers (which org/dispensary they may open). */
  assigned_tenant_keys: string[]
  /** Treez location names within a tenant; meaningful for managers (discount + assignment UI). */
  assigned_store_names: string[]
}
