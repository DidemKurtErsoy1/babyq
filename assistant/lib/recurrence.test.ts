import { describe, expect, it } from 'vitest';
import { isRecurrenceRule, occursOn } from './recurrence';

const anchor = { year: 2026, month: 9, day: 15 }; // a Tuesday

describe('occursOn', () => {
  it('never fires before the anchor', () => {
    expect(occursOn(anchor, 'daily', { year: 2026, month: 9, day: 14 })).toBe(false);
    expect(occursOn(anchor, 'weekly', { year: 2026, month: 9, day: 8 })).toBe(false);
  });

  it('always fires on the anchor itself', () => {
    for (const rule of ['daily', 'weekly', 'monthly', 'yearly', 'weekdays'] as const) {
      expect(occursOn(anchor, rule, anchor)).toBe(true);
    }
  });

  it('weekly lands on the same weekday', () => {
    expect(occursOn(anchor, 'weekly', { year: 2026, month: 9, day: 22 })).toBe(true);
    expect(occursOn(anchor, 'weekly', { year: 2026, month: 9, day: 23 })).toBe(false);
  });

  it('biweekly skips the odd week', () => {
    expect(occursOn(anchor, 'biweekly', { year: 2026, month: 9, day: 22 })).toBe(false);
    expect(occursOn(anchor, 'biweekly', { year: 2026, month: 9, day: 29 })).toBe(true);
  });

  it('weekdays skips the weekend', () => {
    expect(occursOn(anchor, 'weekdays', { year: 2026, month: 9, day: 18 })).toBe(true); // Fri
    expect(occursOn(anchor, 'weekdays', { year: 2026, month: 9, day: 19 })).toBe(false); // Sat
    expect(occursOn(anchor, 'weekdays', { year: 2026, month: 9, day: 20 })).toBe(false); // Sun
  });

  it('monthly keeps the day of month', () => {
    expect(occursOn(anchor, 'monthly', { year: 2026, month: 10, day: 15 })).toBe(true);
    expect(occursOn(anchor, 'monthly', { year: 2027, month: 1, day: 15 })).toBe(true);
    expect(occursOn(anchor, 'monthly', { year: 2026, month: 10, day: 14 })).toBe(false);
  });

  it('monthly on the 31st skips short months rather than sliding', () => {
    const end = { year: 2026, month: 1, day: 31 };
    expect(occursOn(end, 'monthly', { year: 2026, month: 2, day: 28 })).toBe(false);
    expect(occursOn(end, 'monthly', { year: 2026, month: 3, day: 1 })).toBe(false);
    expect(occursOn(end, 'monthly', { year: 2026, month: 3, day: 31 })).toBe(true);
  });

  it('yearly needs both month and day', () => {
    expect(occursOn(anchor, 'yearly', { year: 2027, month: 9, day: 15 })).toBe(true);
    expect(occursOn(anchor, 'yearly', { year: 2027, month: 10, day: 15 })).toBe(false);
  });
});

describe('isRecurrenceRule', () => {
  it('accepts known rules and rejects anything else', () => {
    expect(isRecurrenceRule('weekly')).toBe(true);
    expect(isRecurrenceRule('FREQ=WEEKLY;BYDAY=TU')).toBe(false);
    expect(isRecurrenceRule('')).toBe(false);
  });
});
