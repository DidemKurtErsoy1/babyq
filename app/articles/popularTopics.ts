// app/articles/popularTopics.ts
//
// Curated internal links from the homepage into the article library.
//
// Hand-written rather than derived from ARTICLES so that (a) full article
// bodies don't get pulled into the homepage JS bundle, and (b) the anchor text
// can be the phrasing parents actually search for — which is the whole point of
// an internal-link block. The Turkish labels are deliberately NOT translations
// of the English titles; they're the query a Turkish parent would type.
//
// Because the slugs are typed by hand, popularTopics.test.ts asserts every one
// of them resolves to a real article — a broken internal link is worse for SEO
// than no link at all.

export type PopularTopic = { slug: string; en: string; tr: string };

export const POPULAR_TOPICS: PopularTopic[] = [
  { slug: 'fever-basics-0-12m',                en: 'Baby fever: when to worry',       tr: 'Bebekte ateş: ne zaman doktora?' },
  { slug: 'sleep-0-6m-guide',                  en: 'Sleep guide (0–6 months)',        tr: '0–6 ay bebek uyku düzeni' },
  { slug: 'starting-solids-6m',                en: 'Starting solids at 6 months',     tr: '6. ayda ek gıdaya geçiş' },
  { slug: 'night-waking-6-12m',                en: 'Night waking (6–12 months)',      tr: 'Gece sık uyanma (6–12 ay)' },
  { slug: 'baby-eczema-diaper-rash',           en: 'Baby eczema & diaper rash',       tr: 'Bebekte egzama ve pişik' },
  { slug: 'cold-vs-flu-vs-rsv',                en: 'Cold vs flu vs RSV',              tr: 'Nezle mi, grip mi, RSV mi?' },
  { slug: 'safe-sleep-sids-prevention',        en: 'Safe sleep & SIDS prevention',    tr: 'Güvenli uyku kuralları' },
  { slug: 'first-weeks-checklist-new-parents', en: 'First weeks with a newborn',      tr: 'Yenidoğanla ilk haftalar' },
  { slug: 'breastfeeding-basics',              en: 'Breastfeeding basics',            tr: 'Emzirmenin temelleri' },
  { slug: 'croup-barking-cough',               en: 'Croup: the barking cough',        tr: 'Krup: havlar gibi öksürük' },
  { slug: 'jaundice-in-newborns',              en: "Newborn jaundice: what's normal", tr: 'Yenidoğan sarılığı normal mi?' },
  { slug: 'childproofing-your-home',           en: 'Childproofing your home',         tr: 'Evde bebek güvenliği' },
];
