"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatCountdown,
  formatPstScheduleLabel,
  pstWallClockToUtcMs,
} from "@/lib/auto-publish-pst"
import { ClockIcon, XIcon } from "lucide-react"

export function AutoPublishCountdownBadge({
  dateYmd,
  timeHm,
  onCancel,
  disabled,
}: {
  dateYmd: string
  timeHm: string
  onCancel: () => void
  disabled?: boolean
}) {
  const targetMs = React.useMemo(
    () => pstWallClockToUtcMs(dateYmd, timeHm),
    [dateYmd, timeHm],
  )
  const [remainingMs, setRemainingMs] = React.useState(() =>
    Math.max(0, targetMs - Date.now()),
  )

  React.useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, targetMs - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  const due = remainingMs <= 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant="outline"
        className="h-9 gap-2 border-amber-600/40 bg-amber-50 px-3 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
      >
        <ClockIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-xs font-medium">
          {due ? "Auto-publish due" : `Auto-publish in ${formatCountdown(remainingMs)}`}
        </span>
        <span className="text-[10px] font-normal text-amber-900/80 dark:text-amber-200/80">
          · {formatPstScheduleLabel(dateYmd, timeHm)}
        </span>
      </Badge>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-xs text-muted-foreground"
        onClick={onCancel}
        disabled={disabled}
      >
        <XIcon className="size-3.5" />
        Cancel schedule
      </Button>
    </div>
  )
}
