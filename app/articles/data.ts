// app/articles/data.ts
export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Fever' | 'Feeding' | 'Sleep' | 'Respiratory';
  author: string;
  updated: string; // ISO date string
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { q: string; a: string }[];
  resources: { label: string; url: string }[];
};

export const articles: Article[] = [
  {
    slug: 'fever-basics-0-12m',
    title: 'Fever Basics (0–12 months)',
    excerpt:
      'How to understand baby fever, what to watch for, and when to seek medical care.',
    category: 'Fever',
    author: 'BabyQ Editorial',
    updated: '2025-10-20',
    sections: [
      {
        heading: 'What to Expect by Age',
        paragraphs: [
          'Newborns (<3 months) with a measured fever ≥38°C (100.4°F) should be evaluated promptly.',
          'From 3–12 months, mild fever can accompany common viral illnesses; behavior and hydration matter most.'
        ]
      },
      {
        heading: 'Common Concerns',
        paragraphs: [
          'Thermometer method influences accuracy (rectal is most reliable in infants).',
          'Fever alone is not an illness; it is a sign. Focus on breathing, hydration, responsiveness.'
        ]
      },
      {
        heading: 'When to See a Doctor',
        paragraphs: [
          'Any infant <3 months with ≥38°C.',
          'Any age with breathing difficulty, bluish lips/face, persistent vomiting, seizure, or unresponsiveness.'
        ]
      },
      {
        heading: 'Quick Tips',
        paragraphs: [
          'Dress lightly; keep room cool and ventilated.',
          'Offer fluids frequently; monitor diapers and alertness.',
          'Avoid cold baths or alcohol rubs.'
        ]
      },
      {
        heading: 'Safety Note',
        paragraphs: [
          'This article is general guidance and not a diagnosis. Follow local medical advice.'
        ]
      }
    ],
    faqs: [
      { q: 'Is teething causing fever?', a: 'Teething may cause slight warmth or irritability, but persistent ≥38°C fever suggests another cause.' },
      { q: 'Which thermometer is best?', a: 'Rectal thermometers are most accurate for infants; follow device instructions strictly.' },
      { q: 'How long can fever last?', a: 'Viral fevers often improve in 2–3 days, but watch overall condition and hydration.' },
      { q: 'What if baby refuses fluids?', a: 'Offer small, frequent sips. If refusal persists or dehydration signs appear, seek care.' }
    ],
    resources: [
      { label: 'WHO: Child Health Basics', url: 'https://www.who.int/' },
      { label: 'AAP: Fever in Children', url: 'https://www.aap.org/' }
    ]
  },
  {
    slug: 'starting-solids-6m',
    title: 'Starting Solids Around 6 Months',
    excerpt:
      'Readiness signs, textures, and safety tips for introducing solids.',
    category: 'Feeding',
    author: 'BabyQ Editorial',
    updated: '2025-10-20',
    sections: [
      {
        heading: 'Readiness Signs',
        paragraphs: [
          'Good head control, sits with support, shows interest in food, and can move food to the back of the mouth.'
        ]
      },
      {
        heading: 'Textures & Progression',
        paragraphs: [
          'Begin with smooth purees; gradually move to mashed and soft finger foods as skills develop.'
        ]
      },
      {
        heading: 'Allergens',
        paragraphs: [
          'Introduce common allergens one by one; watch for reactions. Discuss with your clinician if you have concerns.'
        ]
      },
      {
        heading: 'Quick Tips',
        paragraphs: [
          'One new food at a time; small portions; never force-feed.',
          'Keep mealtimes calm; sit upright and supervised.'
        ]
      }
    ],
    faqs: [
      { q: 'Water with meals?', a: 'Small sips are fine when solids start, but milk/appropriate formula remains primary nutrition.' },
      { q: 'Choking vs gagging?', a: 'Gagging is common as skills develop; choking is silent and dangerous—learn basic first aid.' },
      { q: 'Iron-rich foods?', a: 'Offer iron-fortified cereals, lentils, and meats as age-appropriate.' },
      { q: 'How often?', a: 'Start once a day and build up as interest and tolerance grow.' }
    ],
    resources: [
      { label: 'WHO: Complementary Feeding', url: 'https://www.who.int/' },
      { label: 'NHS: Weaning', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'sleep-0-6m-guide',
    title: 'Sleep Guide (0–6 months)',
    excerpt:
      'Normal patterns, soothing strategies, and safe-sleep reminders.',
    category: 'Sleep',
    author: 'BabyQ Editorial',
    updated: '2025-10-20',
    sections: [
      {
        heading: 'Normal Patterns',
        paragraphs: [
          'Newborns sleep in short stretches; circadian rhythm matures gradually.',
          'Day–night confusion is common early on.'
        ]
      },
      {
        heading: 'Soothing Strategies',
        paragraphs: [
          'White noise, swaddling (age-appropriate), and consistent routines can help.',
          'Respond to hunger cues and safe comforting.'
        ]
      },
      {
        heading: 'Safe Sleep',
        paragraphs: [
          'Back to sleep on a firm, flat surface. Keep sleep area free of soft objects.',
          'Avoid overheating; maintain smoke-free environment.'
        ]
      },
      {
        heading: 'When to Seek Help',
        paragraphs: [
          'Breathing difficulty, pauses, or color changes require evaluation.',
          'If persistent sleep issues affect growth or feeding, consult your clinician.'
        ]
      }
    ],
    faqs: [
      { q: 'How long should naps be?', a: 'Varies widely; focus on total daily sleep and baby’s overall mood and feeding.' },
      { q: 'Is co-sleeping safe?', a: 'Follow local guidance; many authorities advise room-sharing without bed-sharing for safety.' },
      { q: 'Can I use swaddles?', a: 'Use age-appropriate swaddles and stop once rolling begins.' },
      { q: 'Best bedtime routine?', a: 'Simple, consistent steps: feed, change, dim lights, calm voice, and safe sleep environment.' }
    ],
    resources: [
      { label: 'AAP: Safe Sleep', url: 'https://www.aap.org/' },
      { label: 'NHS: Baby Sleep', url: 'https://www.nhs.uk/' }
    ]
  }
];



