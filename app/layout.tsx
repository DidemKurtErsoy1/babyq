// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import SwRegister from "./sw-register";
import NavClient from "./components/NavClient";
import InstallPrompt from "./components/InstallPrompt";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const DESCRIPTION =
  "Ask about your baby's symptoms and get a short, safe, parent-friendly answer in seconds — with rule-based emergency detection, a curated pediatric FAQ, and a vaccination calendar. In Turkish and English.";

export const metadata: Metadata = {
  metadataBase: new URL("https://babyq.app"),
  title: {
    default: "BabyQ — Instant, safe answers for your baby's health",
    template: "%s · BabyQ",
  },
  description: DESCRIPTION,
  applicationName: "BabyQ",
  keywords: [
    "baby health", "pediatric Q&A", "baby fever", "baby symptoms", "parenting",
    "bebek sağlığı", "çocuk sağlığı", "aşı takvimi", "bebekte ateş", "ebeveyn",
  ],
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "BabyQ",
    url: "https://babyq.app",
    title: "BabyQ — Instant, safe answers for your baby's health",
    description: DESCRIPTION,
    // No `images` here on purpose: app/opengraph-image.tsx supplies the 1200×630
    // card via the file convention. Setting images explicitly would override it
    // and put the square icon back into link previews.
  },
  twitter: {
    card: "summary_large_image",
    title: "BabyQ — Instant, safe answers for your baby's health",
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#12271E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* Site-level identity for search engines: ties every page to one named
            publisher, which is what "who is behind this health content?" checks
            look for. No SearchAction is declared — BabyQ has no query-param
            search URL, and claiming one that 404s is worse than claiming none. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://babyq.app/#org",
                  name: "BabyQ",
                  url: "https://babyq.app",
                  logo: "https://babyq.app/icon-512.png",
                  email: "didemkurtersoy@gmail.com",
                },
                {
                  "@type": "WebSite",
                  "@id": "https://babyq.app/#website",
                  name: "BabyQ",
                  url: "https://babyq.app",
                  description: DESCRIPTION,
                  publisher: { "@id": "https://babyq.app/#org" },
                  inLanguage: ["tr", "en"],
                },
              ],
            }),
          }}
        />
        <Providers />
        <SwRegister />
        <InstallPrompt />

        {/* ── Header / Nav ── */}
        <header className="header">
          <nav className="nav">
            <Link className="brand" href="/">
              <span className="brand-mark">👶</span>
              <span>BabyQ</span>
            </Link>
            <div className="links">
              <Link className="nav-btn" href="/">Ask</Link>
              <Link className="nav-btn" href="/articles">Articles</Link>
              <Link className="nav-btn" href="/calendar">Calendar</Link>
              <Link className="nav-btn" href="/profile">Profile</Link>
              <Link className="nav-btn" href="/legal">Legal</Link>
              <NavClient />
            </div>
          </nav>
        </header>

        {/* ── Page content ── */}
        {children}

        {/* ── Footer ── */}
        <footer className="site-footer">
          © {new Date().getFullYear()}{" "}
          <strong>BabyQ</strong>
          {" "}— safe, concise answers for parents.
        </footer>
      </body>
    </html>
  );
}
