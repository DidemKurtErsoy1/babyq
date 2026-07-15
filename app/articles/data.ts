// app/articles/data.ts
export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Fever' | 'Feeding' | 'Sleep' | 'Respiratory' | 'Newborn Care' | 'Safety' | 'Skin & Bathing';
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
    slug: 'febrile-seizures-what-parents-should-know',
    title: 'Febrile Seizures: What Parents Should Know',
    excerpt:
      'Why fever-related seizures happen, what they look like, and how to respond safely.',
    category: 'Fever',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'What Is a Febrile Seizure?',
        paragraphs: [
          'A febrile seizure is a convulsion triggered by a rapid rise in body temperature, most common between 6 months and 5 years.',
          'Most are brief (under 5 minutes) and do not cause lasting harm, though they are frightening to witness.'
        ]
      },
      {
        heading: 'What It Looks Like',
        paragraphs: [
          'Stiffening or jerking of the arms and legs, rolling eyes, and brief loss of consciousness.',
          'Afterward, babies are often sleepy or confused for a short period; this is normal.'
        ]
      },
      {
        heading: 'What to Do During a Seizure',
        paragraphs: [
          'Lay the baby on their side on a soft, flat surface; do not put anything in their mouth.',
          'Time the seizure. Stay close and remove nearby hazards.',
          'Call emergency services if it lasts longer than 5 minutes, breathing seems abnormal, or this is a first-time seizure.'
        ]
      },
      {
        heading: 'After the Seizure',
        paragraphs: [
          'Even brief, typical febrile seizures usually warrant a same-day medical evaluation to identify the fever’s cause.',
          'Most children with febrile seizures do not go on to develop epilepsy.'
        ]
      },
      {
        heading: 'Safety Note',
        paragraphs: [
          'This article is general guidance and not a diagnosis. Any first seizure should be assessed by a clinician.'
        ]
      }
    ],
    faqs: [
      { q: 'Do febrile seizures cause brain damage?', a: 'Typical febrile seizures are not associated with brain injury or long-term harm.' },
      { q: 'Will it happen again?', a: 'About 1 in 3 children who have one febrile seizure will have another with a future fever.' },
      { q: 'Should I give fever medicine to prevent seizures?', a: 'Fever reducers treat discomfort but have not been shown to reliably prevent febrile seizures.' },
      { q: 'When is it an emergency?', a: 'Seizures lasting over 5 minutes, repeated seizures, or breathing trouble require emergency care immediately.' }
    ],
    resources: [
      { label: 'AAP: Seizures and Fever', url: 'https://www.aap.org/' },
      { label: 'NHS: Febrile Seizures', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'managing-fever-toddlers-1-3y',
    title: 'Managing Fever in Toddlers (1–3 years)',
    excerpt:
      'How fever tends to show up in toddlers and practical steps to keep them comfortable.',
    category: 'Fever',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'What’s Different at This Age',
        paragraphs: [
          'Toddlers can usually tell you they feel unwell, but they may not localize symptoms clearly.',
          'Fever is very common with the frequent viral illnesses of daycare and preschool years.'
        ]
      },
      {
        heading: 'Comfort Measures',
        paragraphs: [
          'Dress in light layers and keep the room comfortably cool.',
          'Encourage fluids in small, frequent amounts; offer favorite foods without pressure to eat much.'
        ]
      },
      {
        heading: 'Medication Basics',
        paragraphs: [
          'Weight-based dosing of age-appropriate fever reducers can help comfort, not just lower the number on the thermometer.',
          'Always confirm dose and product with a pharmacist or clinician, especially if combining medications.'
        ]
      },
      {
        heading: 'When to See a Doctor',
        paragraphs: [
          'Fever above 40°C, fever lasting more than 3 days, or a toddler who seems increasingly unwell, lethargic, or difficult to console.',
          'Any rash that doesn’t fade under pressure, stiff neck, or repeated vomiting.'
        ]
      }
    ],
    faqs: [
      { q: 'Should I wake my toddler to give medicine?', a: 'If they are sleeping comfortably, it is usually fine to let them rest rather than waking them.' },
      { q: 'Is a high number always serious?', a: 'The height of the fever matters less than how the child looks and behaves.' },
      { q: 'Can I alternate fever medicines?', a: 'Discuss this with a pharmacist or clinician first, as dosing errors are more likely when alternating.' },
      { q: 'Does fever mean they need antibiotics?', a: 'Most childhood fevers are viral and do not need antibiotics; a clinician can assess if needed.' }
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
    slug: 'breastfeeding-basics',
    title: 'Breastfeeding Basics for New Parents',
    excerpt:
      'Latching, feeding frequency, and common early challenges explained simply.',
    category: 'Feeding',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Getting a Good Latch',
        paragraphs: [
          'A comfortable latch covers most of the areola, not just the nipple, and shouldn’t cause ongoing pain.',
          'If latching hurts throughout the feed, gently break suction and try repositioning.'
        ]
      },
      {
        heading: 'How Often to Feed',
        paragraphs: [
          'Newborns typically feed 8–12 times in 24 hours, often on demand rather than a strict schedule.',
          'Feeding cues (rooting, hand-to-mouth, smacking lips) usually appear before crying.'
        ]
      },
      {
        heading: 'Is Baby Getting Enough?',
        paragraphs: [
          'Steady weight gain, regular wet and dirty diapers, and audible swallowing are good signs.',
          'A lactation consultant or clinician can help if you’re unsure about supply or weight gain.'
        ]
      },
      {
        heading: 'Common Early Challenges',
        paragraphs: [
          'Engorgement, sore nipples, and cluster feeding in the evenings are common in the first weeks and often improve with support.'
        ]
      }
    ],
    faqs: [
      { q: 'How do I know if baby is hungry vs comfort feeding?', a: 'Both are normal; frequent feeding in early weeks helps establish supply and is not a problem to fix.' },
      { q: 'When should I worry about low supply?', a: 'Poor weight gain or very few wet diapers warrant a prompt check with a clinician or lactation consultant.' },
      { q: 'Can I breastfeed and bottle-feed together?', a: 'Yes, many families combine feeding methods; a lactation consultant can help plan the transition.' },
      { q: 'Is nipple pain normal?', a: 'Some tenderness in the first days can be normal, but ongoing sharp pain usually signals a latch issue worth addressing.' }
    ],
    resources: [
      { label: 'WHO: Breastfeeding', url: 'https://www.who.int/' },
      { label: 'AAP: Breastfeeding Guidance', url: 'https://www.aap.org/' }
    ]
  },
  {
    slug: 'bottle-feeding-formula-safety',
    title: 'Bottle Feeding & Formula Safety',
    excerpt:
      'Safe formula preparation, bottle hygiene, and paced feeding basics.',
    category: 'Feeding',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Preparing Formula Safely',
        paragraphs: [
          'Follow the manufacturer’s water-to-powder ratio exactly; never dilute or concentrate formula.',
          'Use freshly boiled water cooled to the temperature specified on the packaging, especially for powdered formula.'
        ]
      },
      {
        heading: 'Storage & Hygiene',
        paragraphs: [
          'Sterilize bottles and nipples for young infants, and discard any unfinished bottle within the time recommended by the manufacturer.',
          'Prepared formula should be refrigerated promptly if not used right away.'
        ]
      },
      {
        heading: 'Paced Bottle Feeding',
        paragraphs: [
          'Holding baby semi-upright and keeping the bottle horizontal can slow the flow and reduce overfeeding.',
          'Watch for fullness cues (turning away, slowing down) rather than encouraging the bottle to be finished.'
        ]
      },
      {
        heading: 'When to Check In With a Clinician',
        paragraphs: [
          'Frequent spit-up with poor weight gain, persistent refusal of the bottle, or signs of an allergic reaction (rash, vomiting, blood in stool) should be evaluated.'
        ]
      }
    ],
    faqs: [
      { q: 'Can I reuse leftover formula?', a: 'No — discard unfinished formula after the recommended window to reduce bacterial risk.' },
      { q: 'Tap water or bottled water?', a: 'Follow local guidance; in many areas, boiled tap water is recommended for infant formula.' },
      { q: 'How much formula does my baby need?', a: 'Amounts vary by age and weight; a clinician or the formula packaging can guide typical ranges.' },
      { q: 'Is switching formula brands okay?', a: 'Usually yes, but introduce changes gradually and watch for digestive reactions.' }
    ],
    resources: [
      { label: 'WHO: Safe Formula Preparation', url: 'https://www.who.int/' },
      { label: 'NHS: Bottle Feeding', url: 'https://www.nhs.uk/' }
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
  },
  {
    slug: 'safe-sleep-sids-prevention',
    title: 'Safe Sleep & SIDS Prevention',
    excerpt:
      'The core safe-sleep rules every caregiver should know, explained plainly.',
    category: 'Sleep',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'The Core Rules',
        paragraphs: [
          'Always place babies on their back to sleep, for every sleep, until their first birthday.',
          'Use a firm, flat sleep surface with a fitted sheet — no inclined sleepers or soft bedding.'
        ]
      },
      {
        heading: 'Keep the Sleep Space Bare',
        paragraphs: [
          'No pillows, blankets, bumpers, or soft toys in the crib or bassinet during sleep.',
          'A sleep sack or wearable blanket is a safer alternative to loose bedding.'
        ]
      },
      {
        heading: 'Room-Sharing',
        paragraphs: [
          'Room-sharing without bed-sharing for at least the first 6 months is associated with lower risk.',
          'Avoid sleeping with baby on sofas or armchairs, which carry higher risk than a firm crib surface.'
        ]
      },
      {
        heading: 'Other Risk Reducers',
        paragraphs: [
          'Avoid smoke exposure during and after pregnancy, avoid overheating, and consider offering a pacifier at sleep times once feeding is established.'
        ]
      }
    ],
    faqs: [
      { q: 'What if my baby rolls onto their stomach?', a: 'Once babies can roll both ways independently, it’s fine to leave them in the position they land in.' },
      { q: 'Are baby monitors a substitute for safe sleep practices?', a: 'No — monitors can add reassurance but do not replace back-sleeping and a bare crib.' },
      { q: 'Is swaddling safe for sleep?', a: 'Swaddling is fine before babies show signs of rolling; stop once rolling begins.' },
      { q: 'Does a firmer mattress really matter?', a: 'Yes — soft surfaces increase suffocation risk; firm, flat surfaces are safest.' }
    ],
    resources: [
      { label: 'AAP: Safe Sleep', url: 'https://www.aap.org/' },
      { label: 'WHO: Child Health Basics', url: 'https://www.who.int/' }
    ]
  },
  {
    slug: 'sleep-training-methods-explained',
    title: 'Sleep Training Methods Explained',
    excerpt:
      'An overview of common approaches to help babies learn to fall asleep independently.',
    category: 'Sleep',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Is My Baby Ready?',
        paragraphs: [
          'Many families begin considering sleep training between 4–6 months, once feeding is well established and a clinician has ruled out medical causes of night waking.'
        ]
      },
      {
        heading: 'Common Approaches',
        paragraphs: [
          'Graduated check-ins involve comforting at increasing intervals rather than immediately picking baby up.',
          'Chair method involves gradually moving further from the crib over successive nights.',
          'No single method is proven superior; family comfort and consistency matter most.'
        ]
      },
      {
        heading: 'Setting Up for Success',
        paragraphs: [
          'A consistent, calm bedtime routine and an age-appropriate bedtime make any method easier.',
          'Give a chosen approach several consistent nights before deciding whether it’s working.'
        ]
      },
      {
        heading: 'When to Pause',
        paragraphs: [
          'Illness, travel, or new teeth can disrupt sleep; it’s reasonable to pause training temporarily and resume later.'
        ]
      }
    ],
    faqs: [
      { q: 'Will sleep training harm my baby emotionally?', a: 'Current research has not found evidence of long-term harm from common graduated methods; choose an approach your family is comfortable with.' },
      { q: 'How long does it typically take?', a: 'Many families see change within 3–7 nights, though every baby differs.' },
      { q: 'Do I have to choose just one method?', a: 'No — many families blend elements or adjust based on what feels sustainable.' },
      { q: 'What if nothing seems to work?', a: 'A pediatric sleep consultant or your clinician can help rule out underlying causes like reflux or sleep apnea.' }
    ],
    resources: [
      { label: 'AAP: Healthy Sleep Habits', url: 'https://www.aap.org/' },
      { label: 'NHS: Baby Sleep', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'night-waking-6-12m',
    title: 'Night Waking in Older Babies (6–12 months)',
    excerpt:
      'Why babies who were sleeping well sometimes start waking again, and what helps.',
    category: 'Sleep',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Common Causes',
        paragraphs: [
          'Developmental leaps (crawling, standing), teething, separation anxiety, and mild illness can all disrupt previously good sleep.',
          'Growth spurts can temporarily increase night hunger around this age.'
        ]
      },
      {
        heading: 'What Usually Helps',
        paragraphs: [
          'Keep the bedtime routine consistent even during a rough patch — predictability is reassuring.',
          'Give a brief pause before responding to fussing, since babies often resettle on their own.'
        ]
      },
      {
        heading: 'When It’s Likely a Phase',
        paragraphs: [
          'If daytime mood, feeding, and growth remain normal, temporary night waking is usually developmental rather than concerning.'
        ]
      },
      {
        heading: 'When to Check In',
        paragraphs: [
          'Snoring, gasping, or long breathing pauses during sleep, or waking that comes with persistent daytime distress, are worth discussing with a clinician.'
        ]
      }
    ],
    faqs: [
      { q: 'Is this a sleep regression?', a: 'The term is commonly used for these developmental disruptions; most resolve within a few weeks.' },
      { q: 'Should I feed at every night waking?', a: 'By this age many babies no longer need overnight feeds, but check with your clinician based on growth and history.' },
      { q: 'Can teething really disrupt sleep this much?', a: 'Yes, discomfort from emerging teeth can cause temporary night waking.' },
      { q: 'How long do these phases last?', a: 'Most developmental sleep disruptions improve within 2–6 weeks.' }
    ],
    resources: [
      { label: 'NHS: Baby Sleep', url: 'https://www.nhs.uk/' },
      { label: 'AAP: Healthy Sleep Habits', url: 'https://www.aap.org/' }
    ]
  },
  {
    slug: 'cold-vs-flu-vs-rsv',
    title: 'Common Cold vs Flu vs RSV: Spotting the Difference',
    excerpt:
      'How these common respiratory illnesses differ and what to watch for in babies.',
    category: 'Respiratory',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Common Cold',
        paragraphs: [
          'Usually gradual onset with runny/stuffy nose, mild cough, and low or no fever.',
          'Symptoms typically peak within a few days and resolve within 7–10 days.'
        ]
      },
      {
        heading: 'Flu (Influenza)',
        paragraphs: [
          'Often sudden onset with higher fever, body aches, fatigue, and more pronounced illness than a typical cold.',
          'Young infants may show poor feeding and irritability rather than clear "aches."'
        ]
      },
      {
        heading: 'RSV (Respiratory Syncytial Virus)',
        paragraphs: [
          'Common in infants and young children; can cause wheezing, rapid breathing, and, in some cases, more serious lower-airway illness like bronchiolitis.',
          'Infants under 6 months and premature babies are at higher risk of more severe RSV.'
        ]
      },
      {
        heading: 'When to Seek Care',
        paragraphs: [
          'Rapid or labored breathing, flaring nostrils, visible rib retractions, bluish lips, poor feeding, or lethargy need prompt evaluation regardless of which virus is suspected.'
        ]
      }
    ],
    faqs: [
      { q: 'Can these be told apart without testing?', a: 'There’s overlap in symptoms; a clinician may use testing to confirm, especially for flu or RSV in higher-risk infants.' },
      { q: 'Is RSV always serious?', a: 'Most cases are mild and cold-like, but close monitoring in young infants is important.' },
      { q: 'Do these viruses need antibiotics?', a: 'No — they are viral; antibiotics don’t treat them unless a bacterial complication develops.' },
      { q: 'How can I reduce the risk of catching these?', a: 'Frequent handwashing, avoiding sick contacts, and following recommended vaccination schedules where applicable can help.' }
    ],
    resources: [
      { label: 'WHO: Child Health Basics', url: 'https://www.who.int/' },
      { label: 'AAP: RSV Guidance', url: 'https://www.aap.org/' }
    ]
  },
  {
    slug: 'croup-barking-cough',
    title: 'Croup: Recognizing the Barking Cough',
    excerpt:
      'What croup sounds like, why it happens, and how to manage it at home.',
    category: 'Respiratory',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'What Is Croup?',
        paragraphs: [
          'Croup is a viral infection causing swelling around the voice box and windpipe, leading to a distinctive barking, seal-like cough.',
          'It’s most common in children aged 6 months to 3 years and often worse at night.'
        ]
      },
      {
        heading: 'Recognizing It',
        paragraphs: [
          'A harsh, barking cough often paired with a hoarse voice and a high-pitched sound when breathing in (stridor).',
          'Symptoms frequently start or worsen suddenly at night.'
        ]
      },
      {
        heading: 'Home Comfort Measures',
        paragraphs: [
          'Cool or humid air (such as sitting in a steamy bathroom or by an open window) can sometimes ease breathing.',
          'Keep your child calm — crying can worsen airway narrowing temporarily.'
        ]
      },
      {
        heading: 'When to Seek Care',
        paragraphs: [
          'Stridor at rest, worsening breathing difficulty, drooling, or bluish lips need urgent evaluation.',
          'Most croup improves within a few days, but a clinician may recommend medication to reduce airway swelling.'
        ]
      }
    ],
    faqs: [
      { q: 'Is croup contagious?', a: 'Yes, it spreads like other respiratory viruses through droplets and contact.' },
      { q: 'Does croup always need medication?', a: 'Mild cases may resolve with comfort care, but many clinicians prescribe medication to reduce airway swelling and severity.' },
      { q: 'Why is it worse at night?', a: 'Airway swelling and lying flat can both contribute to nighttime symptom flares.' },
      { q: 'Can croup come back?', a: 'Some children have recurrent episodes, especially with each new respiratory virus, through the toddler years.' }
    ],
    resources: [
      { label: 'NHS: Croup', url: 'https://www.nhs.uk/' },
      { label: 'AAP: Croup Guidance', url: 'https://www.aap.org/' }
    ]
  },
  {
    slug: 'wheezing-asthma-signs-young-children',
    title: 'Wheezing and Early Asthma Signs in Young Children',
    excerpt:
      'What wheezing sounds like, common triggers, and when it may point to asthma.',
    category: 'Respiratory',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'What Is Wheezing?',
        paragraphs: [
          'A high-pitched whistling sound, usually heard on breathing out, caused by narrowed airways.',
          'Many young children wheeze with viral colds without going on to develop asthma.'
        ]
      },
      {
        heading: 'Common Triggers',
        paragraphs: [
          'Viral respiratory infections are the most common trigger in infants and toddlers.',
          'Smoke exposure, allergens, and cold air can also provoke wheezing in some children.'
        ]
      },
      {
        heading: 'When It May Suggest Asthma',
        paragraphs: [
          'Recurrent wheezing episodes, wheezing between illnesses, or a family history of asthma/allergies raise the likelihood of an asthma diagnosis.',
          'A clinician typically monitors patterns over time before diagnosing asthma in very young children.'
        ]
      },
      {
        heading: 'When to Seek Urgent Care',
        paragraphs: [
          'Rapid breathing, visible chest retractions, bluish lips, or a child too breathless to talk or feed need immediate medical attention.'
        ]
      }
    ],
    faqs: [
      { q: 'Does wheezing mean my child has asthma?', a: 'Not necessarily — many toddlers wheeze with colds and outgrow it without an asthma diagnosis.' },
      { q: 'Can I hear wheezing myself?', a: 'Sometimes, but a clinician’s exam with a stethoscope is more reliable for confirming and locating it.' },
      { q: 'Are inhalers safe for young children?', a: 'When prescribed and used correctly under medical guidance, inhalers with spacers are commonly and safely used in young children.' },
      { q: 'Can wheezing be prevented?', a: 'Reducing smoke exposure and managing known triggers can lower frequency, though not all wheezing is preventable.' }
    ],
    resources: [
      { label: 'AAP: Asthma in Children', url: 'https://www.aap.org/' },
      { label: 'WHO: Child Health Basics', url: 'https://www.who.int/' }
    ]
  },
  {
    slug: 'first-weeks-checklist-new-parents',
    title: 'First Weeks Checklist for New Parents',
    excerpt:
      'A practical rundown of what to track and expect in your baby’s first weeks.',
    category: 'Newborn Care',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'What to Track Daily',
        paragraphs: [
          'Wet and dirty diapers, feeding times, and sleep stretches are the easiest early signals that things are on track.',
          'Weight checks at scheduled newborn visits confirm growth is progressing well.'
        ]
      },
      {
        heading: 'What’s Normal in the First Weeks',
        paragraphs: [
          'Cluster feeding in the evenings, irregular sleep, and some weight loss in the first few days (regained by about 2 weeks) are all typical.',
          'Newborns often sneeze, hiccup, and have irregular breathing patterns that are usually harmless.'
        ]
      },
      {
        heading: 'Setting Up Support',
        paragraphs: [
          'Line up help for meals, errands, and overnight stretches where possible — recovery and adjustment take real time.',
          'Know who to call: your pediatric clinic’s after-hours line and local emergency services.'
        ]
      },
      {
        heading: 'When to Call Your Clinician',
        paragraphs: [
          'Fever in a baby under 3 months, poor feeding, very few wet diapers, or a baby who is unusually difficult to wake all warrant a call.'
        ]
      }
    ],
    faqs: [
      { q: 'How many wet diapers is normal?', a: 'By about day 5–6, most newborns have 6 or more wet diapers a day.' },
      { q: 'Is newborn weight loss normal?', a: 'Losing up to about 7–10% of birth weight in the first days is common, with recovery by around 2 weeks.' },
      { q: 'When is the first checkup?', a: 'Schedules vary, but many clinics see newborns within the first few days and again around 2 weeks.' },
      { q: 'What if I’m overwhelmed?', a: 'This is common and worth talking about — postpartum support from your clinician is available and important.' }
    ],
    resources: [
      { label: 'WHO: Newborn Health', url: 'https://www.who.int/' },
      { label: 'NHS: Caring for a Newborn', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'umbilical-cord-circumcision-care',
    title: 'Umbilical Cord & Circumcision Care',
    excerpt:
      'Simple aftercare steps and signs of a problem to watch for.',
    category: 'Newborn Care',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Umbilical Cord Care',
        paragraphs: [
          'Keep the stump clean and dry; fold diapers below it to avoid irritation.',
          'The stump typically dries and falls off within 1–3 weeks — avoid pulling it off early.'
        ]
      },
      {
        heading: 'Signs of Cord Infection',
        paragraphs: [
          'Redness spreading to surrounding skin, foul-smelling discharge, or a fever can indicate infection and need prompt evaluation.'
        ]
      },
      {
        heading: 'Circumcision Aftercare (If Applicable)',
        paragraphs: [
          'Follow your clinician’s specific instructions on cleaning and any recommended ointment.',
          'Mild swelling and a yellowish film during healing are usually normal.'
        ]
      },
      {
        heading: 'When to Seek Care',
        paragraphs: [
          'Persistent bleeding, worsening swelling or redness, difficulty urinating, or fever after circumcision should be checked promptly.'
        ]
      }
    ],
    faqs: [
      { q: 'Can I bathe my baby before the cord falls off?', a: 'Many clinicians recommend sponge baths until the stump falls off; ask your provider about local guidance.' },
      { q: 'Is a little bleeding at the cord base normal?', a: 'A few drops when the stump is falling off can be normal, but ongoing or heavy bleeding needs evaluation.' },
      { q: 'How long does circumcision healing take?', a: 'Most heal within 7–10 days; follow your clinician’s specific aftercare guidance.' },
      { q: 'Should I use alcohol on the cord stump?', a: 'Current guidance in many places favors dry cord care without alcohol; confirm with your clinician.' }
    ],
    resources: [
      { label: 'AAP: Umbilical Cord Care', url: 'https://www.aap.org/' },
      { label: 'NHS: Caring for a Newborn', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'jaundice-in-newborns',
    title: 'Jaundice in Newborns: What’s Normal',
    excerpt:
      'Why newborn jaundice happens, how it’s monitored, and when it needs treatment.',
    category: 'Newborn Care',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Why It Happens',
        paragraphs: [
          'Jaundice is a yellowing of the skin and eyes caused by a buildup of bilirubin, very common in the first week of life as a newborn’s liver matures.'
        ]
      },
      {
        heading: 'What’s Typically Normal',
        paragraphs: [
          'Mild jaundice appearing after day 2–3 and improving by 1–2 weeks is common, especially in breastfed babies.',
          'Clinicians often check bilirubin levels at routine newborn visits to track the trend.'
        ]
      },
      {
        heading: 'When It Needs Attention',
        paragraphs: [
          'Jaundice appearing in the first 24 hours of life, spreading to the arms/legs, or a baby who is very sleepy or feeding poorly should be evaluated promptly.',
          'High bilirubin levels are treatable, commonly with light therapy (phototherapy), under medical guidance.'
        ]
      },
      {
        heading: 'Safety Note',
        paragraphs: [
          'This article is general guidance and not a diagnosis. Newborn jaundice should be tracked with your clinician’s scheduled checks.'
        ]
      }
    ],
    faqs: [
      { q: 'Does breastfeeding cause jaundice?', a: 'Feeding difficulties can contribute to it, but breastfeeding itself has clear benefits; a clinician can help optimize feeding.' },
      { q: 'How is jaundice measured?', a: 'A skin or blood test measures bilirubin levels, often combined with visual assessment.' },
      { q: 'Does jaundice go away on its own?', a: 'Mild cases often resolve on their own as feeding and elimination improve.' },
      { q: 'Is sunlight exposure a treatment?', a: 'Medical phototherapy under supervision is the standard treatment; discuss any home approach with your clinician first.' }
    ],
    resources: [
      { label: 'AAP: Newborn Jaundice', url: 'https://www.aap.org/' },
      { label: 'WHO: Newborn Health', url: 'https://www.who.int/' }
    ]
  },
  {
    slug: 'childproofing-your-home',
    title: 'Childproofing Your Home: A Room-by-Room Guide',
    excerpt:
      'Practical safety steps as your baby becomes mobile.',
    category: 'Safety',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'When to Start',
        paragraphs: [
          'Begin basic childproofing before baby is mobile — rolling, scooting, and crawling can happen sooner than expected.'
        ]
      },
      {
        heading: 'Kitchen & Bathroom',
        paragraphs: [
          'Store cleaning products, medications, and sharp objects out of reach or in locked cabinets.',
          'Set water heater temperature to reduce scald risk, and never leave a baby unattended near water, even briefly.'
        ]
      },
      {
        heading: 'Living Areas',
        paragraphs: [
          'Anchor furniture and TVs to the wall to prevent tip-overs, and cover electrical outlets.',
          'Check for small objects (coins, batteries, button cells) at floor level — these are common choking and ingestion hazards.'
        ]
      },
      {
        heading: 'Stairs & Windows',
        paragraphs: [
          'Install gates at the top and bottom of stairs, and use window guards or stops to prevent falls.'
        ]
      }
    ],
    faqs: [
      { q: 'What’s the single most important safety step?', a: 'Never leave a baby unattended near water, stairs, or on elevated surfaces — supervision is irreplaceable.' },
      { q: 'Are button batteries really that dangerous?', a: 'Yes — swallowed button batteries can cause serious injury quickly; keep them completely out of reach.' },
      { q: 'Do I need to childproof if I supervise closely?', a: 'Yes — childproofing reduces risk during the inevitable moments of divided attention.' },
      { q: 'When can I stop worrying about this?', a: 'Safety needs evolve rather than end — reassess as your child’s mobility and curiosity grow.' }
    ],
    resources: [
      { label: 'AAP: Home Safety', url: 'https://www.aap.org/' },
      { label: 'WHO: Child Health Basics', url: 'https://www.who.int/' }
    ]
  },
  {
    slug: 'car-seat-safety-basics',
    title: 'Car Seat Safety Basics',
    excerpt:
      'Choosing the right seat, correct installation, and common mistakes to avoid.',
    category: 'Safety',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Choosing the Right Seat',
        paragraphs: [
          'Rear-facing seats are recommended for infants and young toddlers; follow the seat’s height and weight limits rather than age alone to decide when to switch stages.'
        ]
      },
      {
        heading: 'Installation Basics',
        paragraphs: [
          'The seat should not move more than about an inch side-to-side or front-to-back once installed.',
          'Many local fire or police stations, or certified technicians, offer free installation checks.'
        ]
      },
      {
        heading: 'Common Mistakes',
        paragraphs: [
          'Harness straps that are too loose, chest clips positioned too low, and bulky winter coats under the harness can all reduce protection.',
          'Turning a child forward-facing too early is one of the most common preventable mistakes.'
        ]
      },
      {
        heading: 'Every Ride, Every Time',
        paragraphs: [
          'Consistent, correct use on every trip — even short ones — is what makes car seats effective.'
        ]
      }
    ],
    faqs: [
      { q: 'When can my child face forward?', a: 'Only once they exceed the rear-facing seat’s height/weight limit — later is generally safer, not just legally sufficient.' },
      { q: 'Can I buy a used car seat?', a: 'Only if you know its full history and it hasn’t been in a crash or expired — otherwise a new seat is safer.' },
      { q: 'How tight should the harness be?', a: 'You should not be able to pinch excess strap at the shoulder once buckled — snug is correct.' },
      { q: 'Is the chest clip position important?', a: 'Yes — it should sit at armpit level, not on the belly or neck.' }
    ],
    resources: [
      { label: 'AAP: Car Seat Safety', url: 'https://www.aap.org/' },
      { label: 'NHS: Child Car Seats', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'baby-eczema-diaper-rash',
    title: 'Baby Eczema & Diaper Rash',
    excerpt:
      'Telling common skin irritations apart and how to soothe them.',
    category: 'Skin & Bathing',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'Baby Eczema',
        paragraphs: [
          'Often appears as dry, red, itchy patches on the cheeks, scalp, or joints (elbows, knees) and can flare with dry air or irritants.',
          'Regular, fragrance-free moisturizer applied right after bathing is a first-line comfort measure.'
        ]
      },
      {
        heading: 'Diaper Rash',
        paragraphs: [
          'Usually caused by prolonged contact with wet or soiled diapers; appears as redness in the diaper area.',
          'Frequent diaper changes, gentle cleaning, and a barrier cream can help most mild cases.'
        ]
      },
      {
        heading: 'Telling Them Apart',
        paragraphs: [
          'Eczema tends to be dry and itchy in multiple body areas; diaper rash is localized to the diaper area and linked to moisture exposure.',
          'A rash with pimple-like bumps or satellite spots beyond the diaper edges may suggest a yeast component.'
        ]
      },
      {
        heading: 'When to See a Clinician',
        paragraphs: [
          'Rash that worsens despite home care, spreads, blisters, or is accompanied by fever should be evaluated.'
        ]
      }
    ],
    faqs: [
      { q: 'Is eczema caused by food allergies?', a: 'Sometimes related, but not always — a clinician can help assess if allergy testing is warranted.' },
      { q: 'How often should I change diapers to prevent rash?', a: 'Checking every 2–3 hours and after bowel movements helps reduce prolonged moisture contact.' },
      { q: 'Are baby wipes safe for irritated skin?', a: 'Fragrance-free, alcohol-free wipes (or plain water and a soft cloth) are gentler during a flare-up.' },
      { q: 'Can I use steroid cream on my baby?', a: 'Only under a clinician’s guidance — strength and duration matter for infant skin.' }
    ],
    resources: [
      { label: 'AAP: Skin Care for Babies', url: 'https://www.aap.org/' },
      { label: 'NHS: Nappy Rash', url: 'https://www.nhs.uk/' }
    ]
  },
  {
    slug: 'bathing-newborns-safely',
    title: 'Bathing Newborns Safely',
    excerpt:
      'How often to bathe, water temperature, and safety basics for the first baths.',
    category: 'Skin & Bathing',
    author: 'BabyQ Editorial',
    updated: '2025-11-03',
    sections: [
      {
        heading: 'How Often to Bathe',
        paragraphs: [
          'Newborns don’t need daily baths; 2–3 times a week is often enough until they’re more mobile and active.',
          'Sponge baths are commonly used until the umbilical cord stump falls off.'
        ]
      },
      {
        heading: 'Water Temperature & Setup',
        paragraphs: [
          'Water should feel warm, not hot, to the inside of your wrist — around body temperature is a good guide.',
          'Gather towel, clean clothes, and diaper within reach before starting so you never need to look away.'
        ]
      },
      {
        heading: 'Safety Basics',
        paragraphs: [
          'Never leave a baby unattended in the bath, even for a few seconds — drowning can happen silently and quickly.',
          'Support the head and neck at all times in young infants.'
        ]
      },
      {
        heading: 'Skin Care After Bathing',
        paragraphs: [
          'Pat (don’t rub) dry and apply a fragrance-free moisturizer, especially if skin tends to be dry.'
        ]
      }
    ],
    faqs: [
      { q: 'What soap should I use?', a: 'A mild, fragrance-free baby cleanser is usually gentlest; plain water alone is fine for very young newborns.' },
      { q: 'Is a baby bathtub necessary?', a: 'It’s helpful but not required — a clean sink or basin can work with proper support and care.' },
      { q: 'Can I bathe my baby every day if they enjoy it?', a: 'Occasional daily baths are generally fine; just watch for dry skin and moisturize as needed.' },
      { q: 'What if my baby cries during baths?', a: 'This is common at first; a warm room, gentle voice, and gradual exposure often help over time.' }
    ],
    resources: [
      { label: 'NHS: Bathing Your Baby', url: 'https://www.nhs.uk/' },
      { label: 'AAP: Skin Care for Babies', url: 'https://www.aap.org/' }
    ]
  }
];
