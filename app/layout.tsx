// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import SwRegister from "./sw-register";
import NavClient from "./components/NavClient";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BabyQ — Parenting Answers",
  description: "Trusted, instant answers to the questions every parent has.",
  manifest: "/manifest.json",
  themeColor: "#12271E",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers />
        <SwRegister />

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
