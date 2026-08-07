import { describe, it, expect } from 'vitest';
import { POPULAR_TOPICS, topicHref } from './popularTopics';
import { articles } from './data';
import { trSlugForEn } from './data.tr';

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

  it('sends Turkish readers to the Turkish article when one exists', () => {
    const fever = POPULAR_TOPICS.find((t) => t.slug === 'fever-basics-0-12m')!;
    expect(topicHref(fever, 'tr', trSlugForEn(fever.slug))).toBe('/tr/makaleler/bebekte-ates');
    expect(topicHref(fever, 'en', trSlugForEn(fever.slug))).toBe('/articles/fever-basics-0-12m');
  });

  it('falls back to the English article when no translation exists', () => {
    const untranslated = POPULAR_TOPICS.find((t) => !trSlugForEn(t.slug))!;
    expect(topicHref(untranslated, 'tr', trSlugForEn(untranslated.slug)))
      .toBe(`/articles/${untranslated.slug}`);
  });

  it('has non-empty labels in both languages', () => {
    for (const t of POPULAR_TOPICS) {
      expect(t.en.trim(), `en label for ${t.slug}`).not.toBe('');
      expect(t.tr.trim(), `tr label for ${t.slug}`).not.toBe('');
    }
  });
});
