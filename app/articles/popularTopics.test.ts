import { describe, it, expect } from 'vitest';
import { POPULAR_TOPICS } from './popularTopics';
import { articles } from './data';

describe('POPULAR_TOPICS', () => {
  const slugs = new Set(articles.map((a) => a.slug));

  // The homepage renders these as hrefs. A typo here ships a 404 to every
  // visitor and to Google — which is worse than not linking at all.
  it('every slug resolves to a real article', () => {
    const broken = POPULAR_TOPICS.filter((t) => !slugs.has(t.slug)).map((t) => t.slug);
    expect(broken).toEqual([]);
  });

  it('has no duplicate slugs', () => {
    const seen = POPULAR_TOPICS.map((t) => t.slug);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('has non-empty labels in both languages', () => {
    for (const t of POPULAR_TOPICS) {
      expect(t.en.trim(), `en label for ${t.slug}`).not.toBe('');
      expect(t.tr.trim(), `tr label for ${t.slug}`).not.toBe('');
    }
  });
});
