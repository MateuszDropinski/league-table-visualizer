const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

/**
 * Renders a `fetchedAt` timestamp as "updated 5 minutes ago".
 *
 * The mock snapshots carry fixed dates from a past season so regenerating them
 * never churns git, which means this reads in months while developing against
 * mocks and in minutes once the hourly pipeline is live.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'unknown'

  const seconds = Math.round((now.getTime() - then) / 1000)
  if (seconds < MINUTE) return 'just now'

  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (seconds < HOUR) return format.format(-Math.round(seconds / MINUTE), 'minute')
  if (seconds < DAY) return format.format(-Math.round(seconds / HOUR), 'hour')
  if (seconds < DAY * 30) return format.format(-Math.round(seconds / DAY), 'day')
  if (seconds < DAY * 365) return format.format(-Math.round(seconds / (DAY * 30)), 'month')
  return format.format(-Math.round(seconds / (DAY * 365)), 'year')
}
