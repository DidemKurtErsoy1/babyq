import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayOfWeek,
  daysBetween,
  formatLocalTime,
  instantFromLocal,
  localDateKey,
  localDateOf,
  localDayRange,
  zonedParts,
} from './time';

const IST = 'Europe/Istanbul'; // UTC+3, no DST since 2016
const NYC = 'America/New_York'; // DST, so it catches offset bugs Istanbul hides

describe('zonedParts', () => {
  it('reads wall-clock time in the target zone, not UTC', () => {
    const p = zonedParts(new Date('2026-09-15T06:30:00Z'), IST);
    expect(p).toMatchObject({ year: 2026, month: 9, day: 15, hour: 9, minute: 30 });
  });

  it('reports midnight as hour 0, never 24', () => {
    expect(zonedParts(new Date('2026-09-14T21:00:00Z'), IST).hour).toBe(0);
  });

  it('rolls the date backwards when the zone is behind UTC', () => {
    const p = zonedParts(new Date('2026-09-15T02:00:00Z'), NYC);
    expect(p).toMatchObject({ year: 2026, month: 9, day: 14, hour: 22 });
  });
});

describe('localDayRange', () => {
  it('covers the local day, not the UTC day', () => {
    const { start, end } = localDayRange({ year: 2026, month: 9, day: 15 }, IST);
    expect(start.toISOString()).toBe('2026-09-14T21:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-15T21:00:00.000Z');
  });

  it('is 23 hours long on the spring-forward day', () => {
    const { start, end } = localDayRange({ year: 2026, month: 3, day: 8 }, NYC);
    expect(end.getTime() - start.getTime()).toBe(23 * 3_600_000);
  });

  it('is 25 hours long on the fall-back day', () => {
    const { start, end } = localDayRange({ year: 2026, month: 11, day: 1 }, NYC);
    expect(end.getTime() - start.getTime()).toBe(25 * 3_600_000);
  });
});

describe('instantFromLocal', () => {
  it('round-trips through zonedParts across a DST boundary', () => {
    for (const day of [7, 8, 9]) {
      const local = { year: 2026, month: 3, day, hour: 15, minute: 0 };
      const parts = zonedParts(instantFromLocal(local, NYC), NYC);
      expect(parts).toMatchObject(local);
    }
  });

  it('keeps the same wall-clock hour either side of a DST shift', () => {
    const before = instantFromLocal({ year: 2026, month: 3, day: 3, hour: 15 }, NYC);
    const after = instantFromLocal({ year: 2026, month: 3, day: 10, hour: 15 }, NYC);
    // A week apart on the clock, but only 167 hours apart in real time.
    expect(after.getTime() - before.getTime()).toBe(167 * 3_600_000);
    expect(formatLocalTime(before, NYC)).toBe('15:00');
    expect(formatLocalTime(after, NYC)).toBe('15:00');
  });
});

describe('calendar arithmetic', () => {
  it('rolls over month and year boundaries', () => {
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027, month: 1, day: 1,
    });
    expect(addDays({ year: 2028, month: 2, day: 28 }, 1)).toEqual({
      year: 2028, month: 2, day: 29,
    });
  });

  it('counts whole days in both directions', () => {
    const a = { year: 2026, month: 9, day: 15 };
    expect(daysBetween(a, { year: 2026, month: 9, day: 22 })).toBe(7);
    expect(daysBetween(a, { year: 2026, month: 9, day: 8 })).toBe(-7);
  });

  it('knows the weekday', () => {
    expect(dayOfWeek({ year: 2026, month: 9, day: 15 })).toBe(2); // Tuesday
  });
});

describe('localDateKey / localDateOf', () => {
  it('zero-pads to the Postgres date form', () => {
    expect(localDateKey({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05');
  });

  it('derives the local date from an instant', () => {
    expect(localDateOf(new Date('2026-09-14T21:30:00Z'), IST)).toEqual({
      year: 2026, month: 9, day: 15,
    });
  });
});
