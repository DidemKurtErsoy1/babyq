// app/tr/makaleler/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { trArticles } from '../../articles/data.tr';

export const metadata: Metadata = {
  title: 'Bebek Sağlığı Rehberleri',
  description:
    'Bebekte ateş, uyku düzeni, ek gıdaya geçiş, yenidoğan sarılığı ve pişik konularında kısa, kaynaklı ebeveyn rehberleri.',
  alternates: {
    canonical: '/tr/makaleler',
    languages: { tr: '/tr/makaleler', en: '/articles', 'x-default': '/articles' },
  },
  openGraph: {
    title: 'Bebek Sağlığı Rehberleri | BabyQ',
    description:
      'Bebekte ateş, uyku, ek gıda, sarılık ve pişik konularında kısa ve kaynaklı rehberler.',
    url: '/tr/makaleler',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function TrArticlesIndex() {
  return (
    <main className="page-shell">
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang='tr'` }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
        <header style={{ marginBottom: 30 }}>
          <h1 style={{
            fontSize: 34, fontWeight: 800, margin: '0 0 10px',
            color: 'var(--brand)', letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Bebek Sağlığı Rehberleri
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 16.5, lineHeight: 1.6, margin: 0, maxWidth: 620 }}>
            Ebeveynlerin en çok sorduğu konularda kısa, kaynaklı yazılar. Tıbbi tavsiye
            yerine geçmez; acil durumlarda 112’yi arayın.
          </p>
        </header>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {trArticles.map((a) => (
            <Link
              key={a.slug}
              href={`/tr/makaleler/${a.slug}`}
              className="card"
              style={{ padding: '20px 22px', display: 'grid', gap: 8, textDecoration: 'none' }}
            >
              <span className="badge badge-accent" style={{ justifySelf: 'start' }}>🏷️ {a.category}</span>
              <h2 style={{ fontSize: 17.5, fontWeight: 750, margin: 0, color: 'var(--ink)', lineHeight: 1.35 }}>
                {a.title}
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--ink-secondary)', lineHeight: 1.6, margin: 0 }}>
                {a.excerpt}
              </p>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: 28, fontSize: 14, color: 'var(--ink-tertiary)' }}>
          Daha fazla konu için{' '}
          <Link href="/articles" style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
            İngilizce makale arşivine
          </Link>{' '}
          göz atabilirsiniz.
        </p>
      </div>
    </main>
  );
}
