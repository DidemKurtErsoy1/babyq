// app/calendar/layout.tsx
//
// app/calendar/page.tsx is a client component and cannot export metadata; this
// layout gives the vaccination calendar its own title and description in search
// results instead of falling back to the site-wide defaults.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Çocuk Aşı Takvimi / Vaccination Calendar',
  description:
    "Türkiye ulusal aşı takvimine göre bebeğinizin aşılarını doğum tarihinden hesaplayın — hangi aşı kaçıncı ayda, hangi doktor ziyaretinde. Turkey's national childhood immunization schedule, calculated from your baby's birth date.",
  alternates: { canonical: '/calendar' },
  openGraph: {
    title: 'Çocuk Aşı Takvimi | BabyQ',
    description:
      'Bebeğinizin aşı takvimini doğum tarihine göre hesaplayın — Türkiye ulusal aşı programı.',
    url: '/calendar',
    type: 'website',
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
