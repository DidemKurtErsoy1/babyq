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
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "BabyQ" }],
  },
  twitter: {
    card: "summary",
    title: "BabyQ — Instant, safe answers for your baby's health",
    description: DESCRIPTION,
    images: ["/icon-512.png"],
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
