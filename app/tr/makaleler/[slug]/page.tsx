// app/tr/makaleler/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { trArticles, getTrArticle } from '../../../articles/data.tr';

export function generateStaticParams() {
  return trArticles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getTrArticle(params.slug);
  if (!a) return {};
  const url = `/tr/makaleler/${a.slug}`;
  return {
    title: a.title,
    description: a.excerpt,
    alternates: {
      canonical: url,
      // Declares this page and its English counterpart as the same content in
      // two languages, so Google serves the Turkish URL to Turkish searchers
      // instead of treating the pair as duplicates and picking one.
      languages: {
        tr: url,
        en: `/articles/${a.enSlug}`,
        'x-default': `/articles/${a.enSlug}`,
      },
    },
    openGraph: {
      type: 'article',
      url,
      title: a.title,
      description: a.excerpt,
      publishedTime: a.updated,
      locale: 'tr_TR',
    },
    twitter: { card: 'summary_large_image', title: a.title, description: a.excerpt },
  };
}

export default function TrArticlePage({ params }: { params: { slug: string } }) {
  const a = getTrArticle(params.slug);
  if (!a) return notFound();

  const base = 'https://babyq.app';
  const canonical = `${base}/tr/makaleler/${a.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt,
    dateModified: a.updated,
    inLanguage: 'tr',
    author: { '@type': 'Organization', name: a.author },
    publisher: { '@type': 'Organization', name: 'BabyQ' },
    mainEntityOfPage: canonical,
    articleSection: a.category,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'BabyQ', item: base },
      { '@type': 'ListItem', position: 2, name: 'Makaleler', item: `${base}/tr/makaleler` },
      { '@type': 'ListItem', position: 3, name: a.title, item: canonical },
    ],
  };

  const faqLd = a.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'tr',
        mainEntity: a.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <main className="page-shell">
      {/* Only the root layout can render <html>, and it is hardcoded to lang="en".
          Correcting it here runs during parse, before paint, so assistive tech and
          renderers see Turkish. The authoritative signal for search engines is the
          hreflang set emitted from generateMetadata above, not this. */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang='tr'` }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '44px 20px 80px' }}>
        <nav style={{ marginBottom: 20 }}>
          <Link
            href="/tr/makaleler"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 14, fontWeight: 650, color: 'var(--accent-strong)',
            }}
          >
            ← Tüm makaleler
          </Link>
        </nav>

        <header style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span aria-label="kategori" className="badge badge-accent">🏷️ {a.category}</span>
            <span style={{ fontSize: 13, color: 'var(--ink-tertiary)' }}>
              Son güncelleme: {new Date(a.updated).toLocaleDateString('tr-TR')} · {a.author}
            </span>
          </div>

          <h1 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 10px', color: 'var(--brand)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {a.title}
          </h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 16.5, lineHeight: 1.6, margin: 0 }}>{a.excerpt}</p>
        </header>

        <article style={{ display: 'grid', gap: 16 }}>
          {a.sections.map((s, idx) => (
            <section key={idx} className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 10px', color: 'var(--ink)' }}>{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} style={{ marginTop: i === 0 ? 0 : 10, lineHeight: 1.7, fontSize: 15, color: 'var(--ink-secondary)' }}>{p}</p>
              ))}
            </section>
          ))}

          {a.faqs?.length ? (
            <section className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 14px', color: 'var(--ink)' }}>Sık sorulanlar</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {a.faqs.map((f, i) => (
                  <div key={i} style={{ paddingBottom: i < a.faqs.length - 1 ? 14 : 0, borderBottom: i < a.faqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontWeight: 650, fontSize: 14.5, color: 'var(--ink)', marginBottom: 4 }}>{f.q}</div>
                    <div style={{ fontSize: 14.5, color: 'var(--ink-secondary)', lineHeight: 1.6 }}>{f.a}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {a.resources?.length ? (
            <section className="card" style={{ padding: '22px 24px' }}>
              <h2 style={{ fontSize: 18.5, fontWeight: 750, margin: '0 0 12px', color: 'var(--ink)' }}>Kaynaklar</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {a.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="chip" style={{ fontSize: 13.5 }}>
                    🔗 {r.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {/* Link to the English original — helps readers who prefer it and gives
              the hreflang pair a crawlable path in both directions. */}
          <p style={{ fontSize: 13.5, color: 'var(--ink-tertiary)', margin: '4px 0 0' }}>
            Bu yazının İngilizcesi:{' '}
            <Link href={`/articles/${a.enSlug}`} style={{ color: 'var(--accent-strong)', fontWeight: 600 }}>
              English version
            </Link>
          </p>
        </article>
      </div>
    </main>
  );
}
