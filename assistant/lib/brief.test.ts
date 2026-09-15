import { describe, expect, it } from 'vitest';
import { buildBrief, composeBrief, renderBrief, resolveForDay } from './brief';
import type { Item } from './types';

const IST = 'Europe/Istanbul';
const NYC = 'America/New_York';

/** 07:00 in Istanbul on Tuesday 15 September 2026 — brief o'clock. */
const NOW = new Date('2026-09-15T04:00:00Z');

function item(partial: Partial<Item> & { title: string }): Item {
  return {
    id: partial.title,
    kind: 'event',
    allDay: false,
    importance: 0,
    source: 'manual',
    status: 'active',
    ...partial,
  };
}

const meeting = item({
  title: 'Ekip toplantısı',
  startsAt: '2026-09-15T07:00:00Z', // 10:00 IST
  endsAt: '2026-09-15T08:00:00Z', // 11:00 IST
  location: 'Zoom',
  source: 'google_calendar',
});

const therapy = item({
  title: 'Psikolog seansı',
  kind: 'appointment',
  // Anchored a week earlier at 15:00 IST, repeating weekly.
  startsAt: '2026-09-08T12:00:00Z',
  recurrence: 'weekly',
  importance: 1,
});

const invoice = item({
  title: 'Fatura öde',
  kind: 'task',
  source: 'notion',
});

const ctx = { now: NOW, timezone: IST, locale: 'tr' as const, name: 'Didem' };

describe('resolveForDay', () => {
  const today = { year: 2026, month: 9, day: 15 };

  it('places a one-off event on its own local day', () => {
    expect(resolveForDay(meeting, today, IST)?.timeLabel).toBe('10:00');
    expect(resolveForDay(meeting, { year: 2026, month: 9, day: 16 }, IST)).toBeNull();
  });

  it('expands a weekly item onto the matching weekday', () => {
    expect(resolveForDay(therapy, today, IST)?.timeLabel).toBe('15:00');
    expect(resolveForDay(therapy, { year: 2026, month: 9, day: 16 }, IST)).toBeNull();
  });

  it('holds the wall-clock time of a recurring item across a DST shift', () => {
    // 15:00 EST on Tuesday 3 March, repeating weekly. The 10th is EDT.
    const session = item({
      title: 'Therapy',
      startsAt: '2026-03-03T20:00:00Z',
      recurrence: 'weekly',
    });
    const after = resolveForDay(session, { year: 2026, month: 3, day: 10 }, NYC);
    expect(after?.timeLabel).toBe('15:00');
    expect(after?.occursAt?.toISOString()).toBe('2026-03-10T19:00:00.000Z');
  });

  it('treats an undated item as open rather than dropping it', () => {
    const entry = resolveForDay(invoice, today, IST);
    expect(entry?.occursAt).toBeNull();
  });

  it('ignores items that are done or archived', () => {
    expect(resolveForDay({ ...meeting, status: 'done' }, today, IST)).toBeNull();
    expect(resolveForDay({ ...meeting, status: 'archived' }, today, IST)).toBeNull();
  });

  it('ignores a recurrence rule it does not understand instead of guessing', () => {
    const exotic = { ...therapy, recurrence: 'FREQ=WEEKLY;BYDAY=TU,TH' };
    expect(resolveForDay(exotic, today, IST)).toBeNull();
  });
});

describe('buildBrief', () => {
  it('sorts the day by start time', () => {
    const payload = buildBrief([therapy, meeting], ctx);
    expect(payload.schedule.map((e) => e.timeLabel)).toEqual(['10:00', '15:00']);
  });

  it('separates timed, all-day and undated items', () => {
    const birthday = item({
      title: 'Ayşe doğum günü',
      startsAt: '2026-09-15T00:00:00Z',
      allDay: true,
    });
    const payload = buildBrief([meeting, birthday, invoice], ctx);
    expect(payload.schedule.map((e) => e.item.title)).toEqual(['Ekip toplantısı']);
    expect(payload.allDay.map((e) => e.item.title)).toEqual(['Ayşe doğum günü']);
    expect(payload.open.map((e) => e.item.title)).toEqual(['Fatura öde']);
  });

  it('leads with what matters, most critical first', () => {
    const urgent = item({ title: 'Vergi son gün', kind: 'bill', importance: 2 });
    const payload = buildBrief([meeting, therapy, urgent], ctx);
    expect(payload.highlights.map((e) => e.item.title)).toEqual([
      'Vergi son gün',
      'Psikolog seansı',
    ]);
  });

  it('flags overlapping appointments', () => {
    const clash = item({ title: 'Müşteri görüşmesi', startsAt: '2026-09-15T07:30:00Z' });
    const payload = buildBrief([meeting, clash], ctx);
    expect(payload.conflicts).toHaveLength(1);
    expect(payload.conflicts[0].a.item.title).toBe('Ekip toplantısı');
    expect(payload.conflicts[0].b.item.title).toBe('Müşteri görüşmesi');
  });

  it('does not invent a clash between back-to-back meetings', () => {
    const next = item({ title: 'Sonraki', startsAt: '2026-09-15T08:00:00Z' });
    expect(buildBrief([meeting, next], ctx).conflicts).toHaveLength(0);
  });

  it('caps the open list so the message stays readable', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      item({ id: `t${i}`, title: `Görev ${i}`, kind: 'task' }),
    );
    expect(buildBrief(many, { ...ctx, maxOpen: 3 }).open).toHaveLength(3);
  });

  it('reports the local date, not the UTC date', () => {
    // 00:30 Istanbul on the 15th is still the 14th in UTC.
    const payload = buildBrief([], { ...ctx, now: new Date('2026-09-14T21:30:00Z') });
    expect(payload.date).toBe('2026-09-15');
  });
});

describe('renderBrief', () => {
  it('writes a Turkish brief with every section', () => {
    const { body } = composeBrief([meeting, therapy, invoice], ctx);
    expect(body).toContain('Günaydın Didem 👋');
    expect(body).toContain('15 Eylül 2026, Salı');
    expect(body).toContain('⚠️ Bugün dikkat');
    expect(body).toContain('• 10:00–11:00 · Ekip toplantısı (Zoom)');
    expect(body).toContain('• 15:00 · Psikolog seansı');
    expect(body).toContain('✅ Bekleyen');
    expect(body).toContain('• Fatura öde');
  });

  it('says so plainly when the day is empty', () => {
    const { body } = composeBrief([], ctx);
    expect(body).toContain('Bugün takviminde bir şey yok.');
  });

  it('drops the name when there is not one', () => {
    const { body } = composeBrief([], { ...ctx, name: null });
    expect(body).toContain('Günaydın 👋');
    expect(body).not.toContain('null');
  });

  it('speaks English when asked', () => {
    const { body } = composeBrief([meeting], { ...ctx, locale: 'en' });
    expect(body).toContain('Good morning Didem 👋');
    expect(body).toContain('15 September 2026, Tuesday');
  });

  it('omits sections that have nothing in them', () => {
    const body = renderBrief(buildBrief([meeting], ctx));
    expect(body).not.toContain('✅ Bekleyen');
    expect(body).not.toContain('⚠️ Bugün dikkat');
  });
});
