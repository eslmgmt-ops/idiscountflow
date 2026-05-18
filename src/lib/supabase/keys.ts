function trimEnv(value: string | undefined): string {
  return value?.trim() ?? ""
}

/**
 * Public Supabase URL + anon/publishable key used by the browser client, middleware, and server helpers.
 *
 * Vercel: use the `NEXT_PUBLIC_*` names so values are available in the client bundle. Also accepts
 * `SUPABASE_URL` / `SUPABASE_ANON_KEY` for Edge/middleware when those are set but names must still match
 * what you configured — see error text for troubleshooting.
 */
export function getPublicSupabaseConfig(): { url: string; key: string } {
  const url = trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  )
  const key = trimEnv(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY,
  )
  if (!url || !key) {
    const needUrl =
      !url &&
      "set NEXT_PUBLIC_SUPABASE_URL (and/or SUPABASE_URL for server/Edge)"
    const needKey =
      !key &&
      "set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY)"
    throw new Error(
      [
        "Missing Supabase URL or public/anon key.",
        !url ? needUrl : null,
        !key ? needKey : null,
        "On Vercel: use these exact names, enable them for the environment you deploy (Production vs Preview), save, then trigger a new deployment — env changes do not apply to old builds.",
      ]
        .filter(Boolean)
        .join(" "),
    )
  }
  return { url, key }
}
