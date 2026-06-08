export const AUTO_PUBLISH_TIMEZONE = "America/Los_Angeles"

/** Wall clock in PST/PDT → UTC epoch ms. */
export function pstWallClockToUtcMs(dateYmd: string, timeHm: string): number {
  const [y, mo, d] = dateYmd.split("-").map(Number)
  const [h, mi] = (timeHm || "00:00").split(":").map(Number)

  const target = { y, mo, d, h, mi }

  const readInTz = (timestamp: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: AUTO_PUBLISH_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(timestamp))
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "0"
    return {
      y: Number(g("year")),
      mo: Number(g("month")),
      d: Number(g("day")),
      h: Number(g("hour")) % 24,
      mi: Number(g("minute")),
    }
  }

  let ms = Date.UTC(y, mo - 1, d, h + 8, mi, 0)
  for (let i = 0; i < 6; i++) {
    const cur = readInTz(ms)
    const curAsUtc = Date.UTC(cur.y, cur.mo - 1, cur.d, cur.h, cur.mi, 0)
    const tgtAsUtc = Date.UTC(target.y, target.mo - 1, target.d, target.h, target.mi, 0)
    ms += tgtAsUtc - curAsUtc
  }
  return ms
}

export function formatPstScheduleLabel(dateYmd: string, timeHm: string): string {
  const ms = pstWallClockToUtcMs(dateYmd, timeHm)
  return new Intl.DateTimeFormat("en-US", {
    timeZone: AUTO_PUBLISH_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(ms))
}

export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "Due now"
  const totalSec = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`
  return `${mins}m ${secs}s`
}

export function normalizeAutoPublishTime(time: string | null | undefined): string {
  return time?.trim() || "00:00"
}

export function getUniformAutoPublishSchedule(
  rows: Array<{
    publishedAt?: string | null
    scheduledPublishDate?: string | null
    scheduledPublishTime?: string | null
  }>,
): { date: string; time: string } | null {
  const unpublished = rows.filter((r) => !r.publishedAt && r.scheduledPublishDate?.trim())
  if (unpublished.length === 0) return null

  const allUnpublished = rows.filter((r) => !r.publishedAt)
  if (allUnpublished.length !== unpublished.length) return null

  const date = unpublished[0].scheduledPublishDate!.trim()
  const time = normalizeAutoPublishTime(unpublished[0].scheduledPublishTime)
  const allSame = unpublished.every(
    (r) =>
      r.scheduledPublishDate?.trim() === date &&
      normalizeAutoPublishTime(r.scheduledPublishTime) === time,
  )
  return allSame ? { date, time } : null
}

export function isAutoPublishDue(
  scheduledPublishDate: string | null | undefined,
  scheduledPublishTime: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!scheduledPublishDate?.trim()) return false
  const targetMs = pstWallClockToUtcMs(
    scheduledPublishDate.trim(),
    scheduledPublishTime?.trim() || "00:00",
  )
  return nowMs >= targetMs
}
