import type { MetadataRoute } from 'next';
import { articles } from './articles/data';

const BASE = 'https://babyq.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/articles`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/calendar`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/articles/${a.slug}`,
    lastModified: new Date(a.updated),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
