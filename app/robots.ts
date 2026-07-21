import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // No point indexing personal or transactional routes.
      disallow: ['/history', '/profile', '/login', '/api/'],
    },
    sitemap: 'https://babyq.app/sitemap.xml',
  };
}
