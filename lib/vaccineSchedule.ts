// lib/vaccineSchedule.ts
//
// Turkey national childhood immunization schedule (T.C. Sağlık Bakanlığı
// Ulusal Çocukluk Dönemi Aşı Takvimi). Cross-checked against multiple
// published sources; consistent across the standard birth→48-month program.
//
// This is INFORMATIONAL reference data for a "what's coming up" reminder,
// NOT a medical record. Exact doses/dates must be confirmed with a
// pediatrician and the child's e-Nabız record. Country-specific to Turkey.
// Official source: https://asi.saglik.gov.tr/

export type Bilingual = { tr: string; en: string };

export type VaccineVisit = {
  ageMonths: number;
  ageLabel: Bilingual;
  vaccines: Bilingual[];
};

export const VACCINE_SCHEDULE: VaccineVisit[] = [
  {
    ageMonths: 0,
    ageLabel: { tr: 'Doğumda', en: 'At birth' },
    vaccines: [{ tr: 'Hepatit B (1. doz)', en: 'Hepatitis B (dose 1)' }],
  },
  {
    ageMonths: 1,
    ageLabel: { tr: '1. ay', en: '1 month' },
    vaccines: [{ tr: 'Hepatit B (2. doz)', en: 'Hepatitis B (dose 2)' }],
  },
  {
    ageMonths: 2,
    ageLabel: { tr: '2. ay', en: '2 months' },
    vaccines: [
      { tr: 'BCG (Verem)', en: 'BCG (Tuberculosis)' },
      { tr: 'Beşli Karma — DaBT-İPA-Hib (1. doz)', en: '5-in-1 — DTaP-IPV-Hib (dose 1)' },
      { tr: 'KPA — Pnömokok (1. doz)', en: 'PCV — Pneumococcal (dose 1)' },
    ],
  },
  {
    ageMonths: 4,
    ageLabel: { tr: '4. ay', en: '4 months' },
    vaccines: [
      { tr: 'Beşli Karma — DaBT-İPA-Hib (2. doz)', en: '5-in-1 — DTaP-IPV-Hib (dose 2)' },
      { tr: 'KPA — Pnömokok (2. doz)', en: 'PCV — Pneumococcal (dose 2)' },
    ],
  },
  {
    ageMonths: 6,
    ageLabel: { tr: '6. ay', en: '6 months' },
    vaccines: [
      { tr: 'Beşli Karma — DaBT-İPA-Hib (3. doz)', en: '5-in-1 — DTaP-IPV-Hib (dose 3)' },
      { tr: 'Hepatit B (3. doz)', en: 'Hepatitis B (dose 3)' },
      { tr: 'OPA — Oral Polio (1. doz)', en: 'OPV — Oral Polio (dose 1)' },
    ],
  },
  {
    ageMonths: 12,
    ageLabel: { tr: '12. ay', en: '12 months' },
    vaccines: [
      { tr: 'KKK — Kızamık-Kızamıkçık-Kabakulak (1. doz)', en: 'MMR — Measles-Mumps-Rubella (dose 1)' },
      { tr: 'KPA — Pnömokok (rapel)', en: 'PCV — Pneumococcal (booster)' },
      { tr: 'Suçiçeği (1. doz)', en: 'Varicella (dose 1)' },
      { tr: 'Hepatit A (1. doz)', en: 'Hepatitis A (dose 1)' },
    ],
  },
  {
    ageMonths: 18,
    ageLabel: { tr: '18. ay', en: '18 months' },
    vaccines: [
      { tr: 'Beşli Karma — DaBT-İPA-Hib (rapel)', en: '5-in-1 — DTaP-IPV-Hib (booster)' },
      { tr: 'OPA — Oral Polio (2. doz)', en: 'OPV — Oral Polio (dose 2)' },
      { tr: 'Hepatit A (2. doz)', en: 'Hepatitis A (dose 2)' },
    ],
  },
  {
    ageMonths: 48,
    ageLabel: { tr: '48. ay (İlkokul öncesi)', en: '48 months (before school)' },
    vaccines: [
      { tr: 'DaBT-İPA (rapel)', en: 'DTaP-IPV (booster)' },
      { tr: 'KKK — Kızamık-Kızamıkçık-Kabakulak (2. doz)', en: 'MMR (dose 2)' },
      { tr: 'OPA — Oral Polio (3. doz)', en: 'OPV — Oral Polio (dose 3)' },
    ],
  },
];

/** Calendar date a visit falls on, given the child's birth date. */
export function visitDate(birthISO: string, ageMonths: number): Date {
  const d = new Date(birthISO);
  d.setMonth(d.getMonth() + ageMonths);
  return d;
}
