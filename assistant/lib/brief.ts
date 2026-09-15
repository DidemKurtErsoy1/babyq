/**
 * Brief composition — the "Günaydın ve Özet" message.
 *
 * This is deliberately deterministic: given the same items and the same moment,
 * it produces the same message, every time, with no model call. A morning brief
 * is a trust exercise. If the agent occasionally paraphrases an appointment
 * time, or drops an item because a model decided it was uninteresting, the user
 * stops believing the message and goes back to opening four apps.
 *
 * An LLM pass can sit on top of this later to warm up the wording, but it may
 * only ever rewrite prose — never decide what is in the list. The list is this
 * function's output and it is testable.
 */

import { occursOn, isRecurrenceRule } from './recurrence';
import {
  type LocalDate,
  addDays,
  formatLocalTime,
  instantFromLocal,
  localDateKey,
  localDayRange,
  zonedParts,
} from './time';
import type { Importance, Item, Locale } from './types';

/** Assumed length of a timed item with no end, used only for overlap hints. */
const DEFAULT_DURATION_MIN = 30;

export type BriefEntry = {
  item: Item;
  /** The instant this item happens today, or null when it is undated/all-day. */
  occursAt: Date | null;
  /** `HH:mm` in the user's zone, or null. */
  timeLabel: string | null;
  endLabel: string | null;
};

export type BriefConflict = { a: BriefEntry; b: BriefEntry };

export type BriefPayload = {
  /** Local `YYYY-MM-DD` the brief is about. */
  date: string;
  timezone: string;
  locale: Locale;
  name: string | null;
  /** Timed items, earliest first. */
  schedule: BriefEntry[];
  /** All-day items for this date. */
  allDay: BriefEntry[];
  /** Items worth leading with (importance >= 1), most important first. */
  highlights: BriefEntry[];
  /** Undated active tasks, so nothing gets silently forgotten. */
  open: BriefEntry[];
  conflicts: BriefConflict[];
};

export type BriefContext = {
  now: Date;
  timezone: string;
  locale: Locale;
  name?: string | null;
  /** How many undated tasks to carry into the message. */
  maxOpen?: number;
};

function durationMs(entry: BriefEntry): number {
  const { startsAt, endsAt } = entry.item;
  if (startsAt && endsAt) {
    const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
    if (ms > 0) return ms;
  }
  return DEFAULT_DURATION_MIN * 60_000;
}

/**
 * Where does this item land on `date`, if at all?
 *
 * A recurring item keeps its anchor's time of day: therapy anchored at 15:00
 * local stays at 15:00 local after a DST shift, rather than drifting to 14:00.
 */
export function resolveForDay(
  item: Item,
  date: LocalDate,
  timezone: string,
): BriefEntry | null {
  if (item.status !== 'active') return null;

  const undated: BriefEntry = { item, occursAt: null, timeLabel: null, endLabel: null };

  if (!item.startsAt) {
    // An undated task belongs to the open list, not to a particular day.
    return item.recurrence ? null : undated;
  }

  const anchorInstant = new Date(item.startsAt);
  if (Number.isNaN(anchorInstant.getTime())) return null;

  const anchorParts = zonedParts(anchorInstant, timezone);
  const anchorDate: LocalDate = {
    year: anchorParts.year,
    month: anchorParts.month,
    day: anchorParts.day,
  };

  let occursAt: Date;

  if (item.recurrence) {
    if (!isRecurrenceRule(item.recurrence)) return null;
    if (!occursOn(anchorDate, item.recurrence, date)) return null;
    occursAt = instantFromLocal(
      { ...date, hour: anchorParts.hour, minute: anchorParts.minute },
      timezone,
    );
  } else {
    const { start, end } = localDayRange(date, timezone);
    if (anchorInstant < start || anchorInstant >= end) return null;
    occursAt = anchorInstant;
  }

  if (item.allDay) {
    return { item, occursAt, timeLabel: null, endLabel: null };
  }

  const endLabel =
    item.endsAt && !item.recurrence
      ? formatLocalTime(new Date(item.endsAt), timezone)
      : null;

  return {
    item,
    occursAt,
    timeLabel: formatLocalTime(occursAt, timezone),
    endLabel,
  };
}

function overlaps(a: BriefEntry, b: BriefEntry): boolean {
  if (!a.occursAt || !b.occursAt) return false;
  if (a.item.allDay || b.item.allDay) return false;
  const aStart = a.occursAt.getTime();
  const bStart = b.occursAt.getTime();
  return aStart < bStart + durationMs(b) && bStart < aStart + durationMs(a);
}

const IMPORTANCE_ORDER: Record<Importance, number> = { 2: 0, 1: 1, 0: 2 };

export function buildBrief(items: Item[], ctx: BriefContext): BriefPayload {
  const { now, timezone, locale } = ctx;
  const parts = zonedParts(now, timezone);
  const date: LocalDate = { year: parts.year, month: parts.month, day: parts.day };

  const schedule: BriefEntry[] = [];
  const allDay: BriefEntry[] = [];
  const open: BriefEntry[] = [];

  for (const item of items) {
    const entry = resolveForDay(item, date, timezone);
    if (!entry) continue;
    if (!entry.occursAt) open.push(entry);
    else if (item.allDay) allDay.push(entry);
    else schedule.push(entry);
  }

  schedule.sort((a, b) => {
    const byTime = (a.occursAt?.getTime() ?? 0) - (b.occursAt?.getTime() ?? 0);
    return byTime !== 0 ? byTime : a.item.title.localeCompare(b.item.title, locale);
  });

  const byImportance = (a: BriefEntry, b: BriefEntry) =>
    IMPORTANCE_ORDER[a.item.importance] - IMPORTANCE_ORDER[b.item.importance];

  allDay.sort(byImportance);
  open.sort(byImportance);

  const conflicts: BriefConflict[] = [];
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      if (overlaps(schedule[i], schedule[j])) {
        conflicts.push({ a: schedule[i], b: schedule[j] });
      }
    }
  }

  const highlights = [...schedule, ...allDay, ...open]
    .filter((e) => e.item.importance >= 1)
    .sort((a, b) => {
      const byImp = byImportance(a, b);
      if (byImp !== 0) return byImp;
      return (a.occursAt?.getTime() ?? Infinity) - (b.occursAt?.getTime() ?? Infinity);
    });

  return {
    date: localDateKey(date),
    timezone,
    locale,
    name: ctx.name ?? null,
    schedule,
    allDay,
    highlights,
    open: open.slice(0, ctx.maxOpen ?? 5),
    conflicts,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const COPY = {
  tr: {
    greeting: (name: string | null) => (name ? `Günaydın ${name} 👋` : 'Günaydın 👋'),
    highlights: '⚠️ Bugün dikkat',
    schedule: '🗓 Günün planı',
    allDay: '📌 Gün boyu',
    open: '✅ Bekleyen',
    conflicts: '⏰ Çakışma',
    conflictLine: (a: string, b: string) => `“${a}” ile “${b}” üst üste geliyor.`,
    empty: 'Bugün takviminde bir şey yok. İyi bir gün olsun.',
    months: [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ],
    weekdays: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
  },
  en: {
    greeting: (name: string | null) => (name ? `Good morning ${name} 👋` : 'Good morning 👋'),
    highlights: '⚠️ Needs attention',
    schedule: '🗓 Today',
    allDay: '📌 All day',
    open: '✅ Open',
    conflicts: '⏰ Clash',
    conflictLine: (a: string, b: string) => `“${a}” overlaps “${b}”.`,
    empty: 'Nothing on your calendar today. Enjoy it.',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
} as const;

function headline(payload: BriefPayload): string {
  const c = COPY[payload.locale];
  const [year, month, day] = payload.date.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${day} ${c.months[month - 1]} ${year}, ${c.weekdays[weekday]}`;
}

function entryLine(entry: BriefEntry): string {
  const time = entry.timeLabel
    ? entry.endLabel
      ? `${entry.timeLabel}–${entry.endLabel} · `
      : `${entry.timeLabel} · `
    : '';
  const where = entry.item.location ? ` (${entry.item.location})` : '';
  return `• ${time}${entry.item.title}${where}`;
}

/** The plain-text message body, ready for WhatsApp. */
export function renderBrief(payload: BriefPayload): string {
  const c = COPY[payload.locale];
  const blocks: string[] = [`${c.greeting(payload.name)}\n${headline(payload)}`];

  const section = (title: string, entries: BriefEntry[]) => {
    if (entries.length === 0) return;
    blocks.push([title, ...entries.map(entryLine)].join('\n'));
  };

  section(c.highlights, payload.highlights);
  section(c.schedule, payload.schedule);
  section(c.allDay, payload.allDay);
  section(c.open, payload.open);

  if (payload.conflicts.length > 0) {
    blocks.push(
      [
        c.conflicts,
        ...payload.conflicts.map(({ a, b }) => `• ${c.conflictLine(a.item.title, b.item.title)}`),
      ].join('\n'),
    );
  }

  if (blocks.length === 1) blocks.push(c.empty);

  return blocks.join('\n\n');
}

export function composeBrief(items: Item[], ctx: BriefContext): {
  payload: BriefPayload;
  body: string;
} {
  const payload = buildBrief(items, ctx);
  return { payload, body: renderBrief(payload) };
}

/** Local date the next brief should cover, given "now". */
export function nextBriefDate(now: Date, timezone: string): LocalDate {
  const p = zonedParts(now, timezone);
  return addDays({ year: p.year, month: p.month, day: p.day }, 1);
}
