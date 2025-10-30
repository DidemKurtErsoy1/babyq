// app/articles/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles } from '../data';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const a = articles.find(x => x.slug === params.slug);
  if (!a) return notFound();

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16 }}>
      <nav style={{ marginBottom: 12 }}>
        <Link href="/articles" style={{ textDecoration: 'underline' }}>
          ← Back to Articles
        </Link>
      </nav>

      <header style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            aria-label="category"
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #DDD',
              background: '#FAF7F0'
            }}
          >
            🏷️ {a.category}
          </span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Last updated: {new Date(a.updated).toLocaleDateString()}
          </span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>• By {a.author}</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{a.title}</h1>
        <p style={{ opacity: 0.8, marginTop: 6 }}>{a.excerpt}</p>
      </header>

      {/* Sections */}
      <article style={{ display: 'grid', gap: 16 }}>
        {a.sections.map((s, idx) => (
          <section key={idx} style={{ background: '#fff', border: '1px solid #EEE', borderRadius: 12, padding: 14 }}>
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} style={{ marginTop: 8, lineHeight: 1.6 }}>{p}</p>
            ))}
          </section>
        ))}

        {/* Mini FAQ */}
        {a.faqs?.length ? (
          <section style={{ background: '#fff', border: '1px solid #EEE', borderRadius: 12, padding: 14 }}>
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>FAQ</h2>
            <ul style={{ marginTop: 8, display: 'grid', gap: 8 }}>
              {a.faqs.map((f, i) => (
                <li key={i}>
                  <strong>Q:</strong> {f.q}
                  <br />
                  <span><strong>A:</strong> {f.a}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Resources */}
        {a.resources?.length ? (
          <section style={{ background: '#fff', border: '1px solid #EEE', borderRadius: 12, padding: 14 }}>
            <h2 style={{ fontSize: 20, margin: '0 0 6px' }}>Resources</h2>
            <ul style={{ marginTop: 8 }}>
              {a.resources.map((r, i) => (
                <li key={i}>
                  <a href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </main>
  );
}
