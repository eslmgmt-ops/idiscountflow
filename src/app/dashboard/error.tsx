"use client"

import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-xl font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "The dashboard hit an unexpected error."}
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  )
}
