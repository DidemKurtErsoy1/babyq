// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Nunito } from "next/font/google";
import "./globals.css";
import SwRegister from "./sw-register";
import NavClient from "./components/NavClient";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BabyQ — Parenting Answers",
  description: "Trusted, instant answers to the questions every parent has.",
  manifest: "/manifest.json",
  themeColor: "#4CAF7D",
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
      <body className={nunito.variable}>
        <SwRegister />

        {/* Header / Nav */}
        <header className="header">
          <nav className="nav">
            <Link className="brand" href="/">
              <span className="brand-mark">🌿</span>
              <span>BabyQ</span>
            </Link>
            <div className="links">
              <Link className="nav-btn" href="/">Ask</Link>
              <Link className="nav-btn" href="/articles">Articles</Link>
              <Link className="nav-btn" href="/profile">Profile</Link>
              <Link className="nav-btn" href="/legal">Legal</Link>
              <NavClient />
            </div>
          </nav>
        </header>

        {/* Page content */}
        <div>
          {children}
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "28px 24px",
            fontSize: 14,
            color: "#636E72",
            borderTop: "1px solid #D8E8DC",
            background: "#F5FAF7",
          }}
        >
          © {new Date().getFullYear()} <strong style={{ color: "#4CAF7D" }}>BabyQ</strong> — safe, concise answers for parents.
        </footer>
      </body>
    </html>
  );
}
