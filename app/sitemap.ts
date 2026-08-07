import type { MetadataRoute } from 'next';
import { articles } from './articles/data';
import { trArticles, trSlugForEn } from './articles/data.tr';

const BASE = 'https://babyq.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/articles`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/calendar`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    // /login, /profile and /history are intentionally absent — robots.ts
    // disallows them, and listing a disallowed URL in the sitemap is a
    // contradiction Search Console reports as an error.
  ];

  // Each entry carries its language alternates so Google discovers the TR/EN
  // pairing from the sitemap as well as from the page's own hreflang tags.
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => {
    const trSlug = trSlugForEn(a.slug);
    return {
      url: `${BASE}/articles/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(trSlug
        ? {
            alternates: {
              languages: {
                en: `${BASE}/articles/${a.slug}`,
                tr: `${BASE}/tr/makaleler/${trSlug}`,
              },
            },
          }
        : {}),
    };
  });

  const trRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/tr/makaleler`, changeFrequency: 'weekly', priority: 0.8 },
    ...trArticles.map((a) => ({
      url: `${BASE}/tr/makaleler/${a.slug}`,
      lastModified: new Date(a.updated),
      changeFrequency: 'monthly' as const,
      // Higher than the English equivalents: Turkish is the audience we're
      // actually trying to reach, and these are the pages meant to rank.
      priority: 0.7,
      alternates: {
        languages: {
          tr: `${BASE}/tr/makaleler/${a.slug}`,
          en: `${BASE}/articles/${a.enSlug}`,
        },
      },
    })),
  ];

  return [...staticRoutes, ...articleRoutes, ...trRoutes];
}
