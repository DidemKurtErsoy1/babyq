// app/articles/layout.tsx
//
// app/articles/page.tsx is a client component, so it cannot export metadata
// itself — without this layout the article index inherits only the root title
// and ships to Google with no description of its own. Article detail pages
// override this via their own generateMetadata.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baby & Toddler Health Guides',
  description:
    'Short, source-backed guides on baby fever, sleep, feeding, rashes and newborn care — written for parents and referenced to WHO, AAP and NHS guidance.',
  alternates: { canonical: '/articles' },
  openGraph: {
    title: 'Baby & Toddler Health Guides | BabyQ',
    description:
      'Short, source-backed guides on baby fever, sleep, feeding, rashes and newborn care.',
    url: '/articles',
    type: 'website',
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
