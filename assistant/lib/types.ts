export type ItemKind =
  | 'appointment'
  | 'reminder'
  | 'bill'
  | 'note'
  | 'event'
  | 'task'
  | 'goal';

export type ItemSource = 'manual' | 'google_calendar' | 'notion';

export type ItemStatus = 'active' | 'done' | 'archived';

/** 0 = normal, 1 = important, 2 = critical. */
export type Importance = 0 | 1 | 2;

/**
 * One thing the assistant might mention. Calendar events, Notion tasks and
 * hand-entered records all become an Item, so ranking has a single shape to
 * work with.
 */
export type Item = {
  id: string;
  kind: ItemKind;
  title: string;
  notes?: string | null;
  location?: string | null;
  /** ISO instant. Null for an undated task ("bir ara fatura öde"). */
  startsAt?: string | null;
  endsAt?: string | null;
  allDay: boolean;
  importance: Importance;
  /** See lib/recurrence.ts for the accepted rules. */
  recurrence?: string | null;
  source: ItemSource;
  status: ItemStatus;
};

export type Locale = 'tr' | 'en';
