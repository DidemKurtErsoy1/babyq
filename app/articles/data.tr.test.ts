import { describe, it, expect } from 'vitest';
import { trArticles, trSlugForEn, getTrArticle } from './data.tr';
import { articles } from './data';

describe('trArticles', () => {
  const enSlugs = new Set(articles.map((a) => a.slug));

  // hreflang is only honoured when both URLs exist and point at each other.
  // An enSlug typo would silently break the pairing on both sides.
  it('every enSlug resolves to a real English article', () => {
    const broken = trArticles.filter((a) => !enSlugs.has(a.enSlug)).map((a) => a.enSlug);
    expect(broken).toEqual([]);
  });

  it('has unique Turkish slugs and unique English counterparts', () => {
    expect(new Set(trArticles.map((a) => a.slug)).size).toBe(trArticles.length);
    expect(new Set(trArticles.map((a) => a.enSlug)).size).toBe(trArticles.length);
  });

  it('uses URL-safe ASCII slugs (no Turkish characters)', () => {
    for (const a of trArticles) {
      expect(a.slug, a.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('round-trips between the two lookups', () => {
    for (const a of trArticles) {
      expect(trSlugForEn(a.enSlug)).toBe(a.slug);
      expect(getTrArticle(a.slug)?.enSlug).toBe(a.enSlug);
    }
  });

  it('returns undefined for unknown slugs rather than throwing', () => {
    expect(getTrArticle('yok-boyle-bir-sey')).toBeUndefined();
    expect(trSlugForEn('no-such-article')).toBeUndefined();
  });

  it('has the content every page and schema block reads', () => {
    for (const a of trArticles) {
      expect(a.title.trim(), a.slug).not.toBe('');
      expect(a.excerpt.trim(), a.slug).not.toBe('');
      expect(a.sections.length, a.slug).toBeGreaterThan(0);
      expect(a.faqs.length, a.slug).toBeGreaterThan(0);
      expect(a.resources.length, a.slug).toBeGreaterThan(0);
      for (const s of a.sections) {
        expect(s.heading.trim(), `${a.slug} heading`).not.toBe('');
        expect(s.paragraphs.length, `${a.slug} / ${s.heading}`).toBeGreaterThan(0);
      }
    }
  });
});
