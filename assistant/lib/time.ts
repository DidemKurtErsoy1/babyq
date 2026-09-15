/**
 * Timezone helpers.
 *
 * The assistant's whole job is reasoning about "today" — and today is a *local*
 * day in the user's zone, not a UTC day. A brief generated at 07:00 in Istanbul
 * is asking about 2026-09-15 local, which starts at 21:00 UTC the day before.
 * Getting this wrong silently shifts every appointment by a few hours, so all
 * day-boundary maths goes through here.
 *
 * We use Intl rather than a date library: Node ships the full IANA database, so
 * DST transitions are handled by the platform instead of by us.
 */

export type LocalDate = { year: number; month: number; day: number };
export type LocalParts = LocalDate & { hour: number; minute: number; second: number };

const partsCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock parts of `instant` as seen in `timeZone`. */
export function zonedParts(instant: Date, timeZone: string): LocalParts {
  const parts = formatter(timeZone).formatToParts(instant);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = Number(p.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    // Some ICU versions render midnight as hour 24 under hour12:false.
    hour: map.hour % 24,
    minute: map.minute,
    second: map.second,
  };
}

/** Milliseconds that `timeZone` is ahead of UTC at `instant`. */
function offsetAt(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // formatToParts drops sub-second precision; add it back before diffing.
  return asUtc - (instant.getTime() - instant.getUTCMilliseconds());
}

/**
 * The UTC instant at which the given wall-clock time occurs in `timeZone`.
 *
 * Solved in two passes: guess using the offset at the naive instant, then
 * re-measure the offset at that guess. One correction is enough for every real
 * zone, because offsets only ever shift by an hour or two — far less than the
 * day-scale error a single pass could leave around a DST boundary.
 */
export function instantFromLocal(
  local: LocalDate & { hour?: number; minute?: number; second?: number },
  timeZone: string,
): Date {
  const naive = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour ?? 0,
    local.minute ?? 0,
    local.second ?? 0,
  );
  const firstGuess = new Date(naive - offsetAt(new Date(naive), timeZone));
  return new Date(naive - offsetAt(firstGuess, timeZone));
}

/** The local calendar date containing `instant`. */
export function localDateOf(instant: Date, timeZone: string): LocalDate {
  const { year, month, day } = zonedParts(instant, timeZone);
  return { year, month, day };
}

/** ISO `YYYY-MM-DD` for a local date — the form Postgres `date` columns take. */
export function localDateKey(date: LocalDate): string {
  const mm = String(date.month).padStart(2, '0');
  const dd = String(date.day).padStart(2, '0');
  return `${date.year}-${mm}-${dd}`;
}

/** Half-open `[start, end)` UTC range covering one local day. */
export function localDayRange(date: LocalDate, timeZone: string): { start: Date; end: Date } {
  const start = instantFromLocal(date, timeZone);
  const end = instantFromLocal(addDays(date, 1), timeZone);
  return { start, end };
}

/** Calendar arithmetic on a local date, with month/year rollover. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day));
  d.setUTCDate(d.getUTCDate() + days);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Whole days from `a` to `b`; negative when `b` is earlier. */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  const ms =
    Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

/** Day of week for a local date: 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: LocalDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

/** `HH:mm` as the user would read it off a clock in their zone. */
export function formatLocalTime(instant: Date, timeZone: string): string {
  const { hour, minute } = zonedParts(instant, timeZone);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
