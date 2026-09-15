/**
 * Recurrence, deliberately smaller than RRULE.
 *
 * Real briefs are driven by a handful of shapes: therapy every Tuesday, rent on
 * the 1st, a birthday once a year, standup on weekdays. Full RFC 5545 buys
 * nothing here and costs a parser we would have to keep correct, so we support
 * the rules people actually enter and reject the rest loudly.
 *
 * Anything more exotic arrives already expanded from Google Calendar, which
 * does its own recurrence server-side.
 */

import { type LocalDate, dayOfWeek, daysBetween } from './time';

export const RECURRENCE_RULES = [
  'daily',
  'weekdays',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
] as const;

export type RecurrenceRule = (typeof RECURRENCE_RULES)[number];

export function isRecurrenceRule(value: string): value is RecurrenceRule {
  return (RECURRENCE_RULES as readonly string[]).includes(value);
}

/**
 * Does an item anchored at `anchor` recur on `candidate`?
 *
 * `anchor` is the first occurrence: nothing recurs before it, so a weekly
 * therapy session added in March does not retroactively appear in February.
 */
export function occursOn(
  anchor: LocalDate,
  rule: RecurrenceRule,
  candidate: LocalDate,
): boolean {
  const delta = daysBetween(anchor, candidate);
  if (delta < 0) return false;
  if (delta === 0) return true;

  switch (rule) {
    case 'daily':
      return true;
    case 'weekdays': {
      const dow = dayOfWeek(candidate);
      return dow >= 1 && dow <= 5;
    }
    case 'weekly':
      return delta % 7 === 0;
    case 'biweekly':
      return delta % 14 === 0;
    case 'monthly':
      // Anchored on the 31st, months without a 31st are simply skipped rather
      // than silently sliding to the 30th or the 1st of the next month.
      return candidate.day === anchor.day;
    case 'yearly':
      return candidate.day === anchor.day && candidate.month === anchor.month;
  }
}
