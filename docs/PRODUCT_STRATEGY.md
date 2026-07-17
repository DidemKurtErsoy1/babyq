# BabyQ — Product Strategy & Roadmap

> A self-directed product strategy exercise for BabyQ, written as if I were its Head of Product:
> competitive analysis, a RICE-prioritized backlog, and a Now / Next / Later roadmap for turning
> a working demo into a real product.
>
> **Author:** Didem Kurt Ersoy · **Framework:** RICE · **Status:** Living document

---

## TL;DR — the thesis in 30 seconds

1. **The market is crowded, but there's a gap.** Global symptom checkers (Ada, Buoy) are cold and generic; tracking apps (Huckleberry, Kinedu) lead with "log your baby" and treat Q&A as secondary; Turkish government apps are official but clunky. None of them is a **fast, warm, Turkish-first baby-health Q&A with a safety-first architecture**.
2. **The real problem isn't growth — it's activation.** Funnel: 43 visitors → only 23% asked a question → 0% signed up. The biggest leak is getting the *first question* asked.
3. **Protect the castle, then activate, then build habit.** "Now" = cost/abuse protection + activation + cheap personalization from data we already collect. "Later" = retention bets like a vaccination calendar.
4. **The one axis that wins is trust.** In a health product, the differentiator isn't the model — it's the safety architecture, source transparency, and emergency routing. BabyQ's three-tier engine is already ahead here.

---

## 01 · Where we are

BabyQ is a live, working product: a three-tier answer engine (Rules → FAQ → AI), TR/EN bilingual detection, multi-baby profiles, 20 reference articles, and an end-to-end PostHog activation funnel. The first real traffic tells a clear story.

| Funnel step | Users | Conversion |
|---|--:|--:|
| Landed on site | 43 | 100% |
| **Started asking** (`ask_started`) | **10** | **23%** ⚠️ |
| Received an answer (`answer_received`) | 8 | 19% |
| Signed up (`signup_completed`) | 0 | 0% |

**Head-of-Product read:** the product *mechanics* are sound — 80% of people who start a question make it all the way to an answer, so the flow itself doesn't leak. The real loss is **landing → first question** (77% drop). The 0% signup is on n=8, so it's not yet a signal; more importantly, *signup may be the wrong activation metric entirely* — the true activation event is probably **"asked a second question."**

---

## 02 · Competitive landscape

The market splits into three clusters. Each has a strength and a blind spot — BabyQ's wedge sits at the intersection of those blind spots.

| Player / cluster | AI Q&A | Baby-specific | Real Turkish | Safety layer | Value without signup | Business model |
|---|:--:|:--:|:--:|:--:|:--:|---|
| **Symptom checkers**<br><sub>Ada, Buoy, K Health, Ubie</sub> | ✅ | generic | ❌ | ✅ | partial | B2B / insurance |
| **Tracking & habit**<br><sub>Huckleberry, Kinedu, TheParentZ</sub> | secondary | ✅ | ❌ | weak | paywalled | Subscription $7–59 |
| **TR government / local**<br><sub>e-Nabız, Annelik Yolculuğu, Babysfer</sub> | ❌ | ✅ | ✅ | official | ✅ | Free / public |
| **BabyQ** | ✅ | ✅ | ✅ | ✅ | ✅ | *None yet* |

**The wedge:** *"An answer for my baby, in Turkish, in seconds, with no signup required, safety-first."* No competitor delivers all five at once.

**But — honestly — there is no moat yet:** single AI provider, thin content, no retention hook, solo team. Strategy has to close that gap through **trust + habit**.

---

## 03 · Scoring methodology

Every feature is scored with **RICE**: **Reach** (how many users it touches, 1–10) × **Impact** (0.5 / 1 / 2 / 3) × **Confidence** (50%–100%) ÷ **Effort** (days for a solo builder). Higher = better return on effort. Priority is derived from the score:

| Tier | Meaning | RICE |
|---|---|---|
| 🔴 **P0** | Do now | ≥ 5 |
| 🟡 **P1** | Next | 2.5 – 4.9 |
| 🟢 **P2** | Soon | 1.0 – 2.4 |
| ⚪ **P3** | Later | < 1.0 |
| 🎯 **Bet** | Low RICE but strategically important | — |

> Scores are calibrated to solo-developer capacity and are meant to be argued with. **The value isn't the ranking — it's *why* the ranking is what it is.**

---

## 04 · Epics & backlog

Seven epics. Each feature shows its RICE inputs (R·I·C·E) and score.

### A · Activation & First Value
*The #1 funnel leak lives here (77% landing→ask). Goal: get the user to the "aha" moment without typing anything.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **A2** Show concern chips on load | ✅ Shipped | — | — | — | — | *done* |
| **A1** One-tap instant demo answer (click example → prefill → auto-answer) | 🔴 P0 | 9 | 2 | 80% | 2 | **7.2** |
| **A3** Social-proof bar ("100+ parents tried it") | 🟡 P1 | 9 | 0.5 | 70% | 1 | **3.2** |
| **A4** Progressive form (question first, age optional after) | 🟢 P2 | 8 | 1 | 60% | 3 | **1.6** |

### B · Trust & Safety
*BabyQ's core differentiator and a health-product must-have. Competitors are criticized for source opacity — this is an attack surface.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **B1** Geo-aware emergency numbers (112 TR / 911 US) on urgent answers | 🔴 P0 | 7 | 2 | 90% | 2 | **6.3** |
| **B2** Always-visible sources/citations on AI answers | 🟢 P2 | 8 | 1 | 80% | 3 | **2.1** |
| **B3** Strengthen red-flag routing (expand symptom lexicon, reduce false-negatives) | 🟢 P2 | 7 | 1 | 70% | 3 | **1.6** |
| **B4** Answer-quality review panel (read the 👍/👎 we already collect) | ⚪ P3 | 5 | 1 | 80% | 4 | **1.0** |

### C · Retention & Habit
*BabyQ today is one-shot Q&A. Competitors win on daily habit. The bets here turn a demo into a product people return to.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **C1** 🎯 Vaccination & milestone calendar + reminders (TR aşı takvimi, PWA push) | 🎯 Bet | 8 | 3 | 60% | 15 | **0.96** |
| **C3** Saved / favorite answers | 🟢 P2 | 6 | 1 | 80% | 2 | **2.4** |
| **C4** Weekly age-based digest email ("your 7-month-old this week") | 🟢 P2 | 6 | 2 | 60% | 5 | **1.4** |
| **C2** Follow-up threads ("how is the fever now?") | 🟢 P2 | 6 | 2 | 60% | 6 | **1.2** |

### D · Personalization & Depth
*We already collect the data (baby profile) but don't use it in the answer. Cheapest "smart" feeling is here.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **D1** Feed the baby profile into the AI prompt (personalized answers) | 🔴 P0 | 8 | 2 | 80% | 2 | **6.4** |
| **D2** Growth / percentile tracking (WHO curves) | ⚪ P3 | 6 | 2 | 50% | 12 | **0.5** |
| **D3** Age-based proactive tips on the home feed | ⚪ P3 | 6 | 1 | 60% | 5 | **0.7** |

### E · Growth & Distribution
*Traffic matters for both the product and the portfolio. Turkey = a WhatsApp country; the cheapest organic loop is there.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **E1** Shareable answer cards → WhatsApp | 🟡 P1 | 8 | 2 | 70% | 3 | **3.7** |
| **E3** PWA "add to home screen" prompt | 🟢 P2 | 6 | 1 | 70% | 2 | **2.1** |
| **E2** SEO: make articles indexable + structured data + long-tail content | 🟢 P2 | 7 | 2 | 60% | 8 | **1.1** |

### F · Business Model (vision)
*No revenue today — which is fine, this is a portfolio / early product. But "what's next?" belongs in the strategy.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **F1** Freemium gate (free Q&A; premium = unlimited + tracking + priority model) | ⚪ P3 | 5 | 2 | 40% | 8 | **0.5** |
| **F2** 🎯 B2B: pharmacy / clinic / brand partnerships (sponsored trusted content) | 🎯 Bet | 4 | 3 | 30% | 20 | **0.2** |

### G · Reliability & Cost
*Boring but critical. LinkedIn traffic is arriving and `/api/ask` is currently open + un-rate-limited — a risk to close before scaling.*

| Feature | Pri | R | I | C | E | RICE |
|---|:--:|:--:|:--:|:--:|:--:|--:|
| **G1** Rate limiting on `/api/ask` (abuse / Gemini bill protection) | 🔴 P0 | 10 | 1 | 90% | 1 | **9.0** |
| **G3** Error monitoring (Sentry) | 🟡 P1 | 6 | 1 | 80% | 1 | **4.8** |
| **G2** Gemini cost monitoring + daily cap | 🟡 P1 | 7 | 1 | 80% | 2 | **2.8** |
| **G4** Answer caching for common questions (speed + cost) | 🟢 P2 | 7 | 1 | 70% | 3 | **1.6** |

---

## 05 · Roadmap — Now / Next / Later

RICE ranking, mapped onto three horizons. Logic: **protect the castle + close the biggest funnel leak + take the cheap wins from data we already have**, then growth loops, then retention and revenue bets.

### 🔴 Now · this sprint — *protect + activate*
| ID | Feature |
|---|---|
| **G1** | Rate limiting **(start today)** |
| **A1** | One-tap instant demo answer |
| **D1** | Feed baby profile into the AI prompt |
| **B1** | Geo-aware emergency numbers |
| **G3** | Error monitoring (Sentry) |

### 🟡 Next · 2–6 weeks — *growth loops + trust*
| ID | Feature |
|---|---|
| **E1** | WhatsApp shareable answer cards |
| **A3** | Social-proof bar |
| **C3** | Saved / favorite answers |
| **G2** | Cost monitoring + cap |
| **B2** | Visible sources |
| **E3** | PWA install prompt |

### 🟢 Later · bets — *retention & revenue, demo → product*
| ID | Feature |
|---|---|
| **C1** | 🎯 Vaccination & milestone calendar |
| **C2** | Follow-up threads |
| **C4** | Weekly digest email |
| **E2** | SEO / long-tail content |
| **F1** | Freemium gate |
| **F2** | 🎯 B2B partnerships |

> **Why C1 (vaccine calendar) is in "Later" despite mattering a lot:** RICE penalizes high effort — but the calendar is the single feature that turns BabyQ from a tool you *visit when something's wrong* into one you *open every week*. That's strategic value RICE can't measure. A Head of Product's job is exactly to step over the score here and say "this is a platform bet."

---

## 06 · Open questions & risks

The decisions I'd want to debate before committing — these are judgment calls, not framework outputs.

**Is the activation metric "signup" or "second question"?**
Signup is 0%, but the product's nature is "get a quick answer and go." The north star might not be signup but **returning users who ask again** — which reframes the whole funnel and the freemium (F1) logic.

**Is this a portfolio piece or a real product?**
The two want different roadmaps. As a portfolio: a few "showcase" features that demonstrate PM thinking are enough. As a real product: the retention bets (C1) become essential.

**Single-AI-provider risk.**
Everything depends on Gemini — we already hit a model-deprecation bug. There's no moat; do we diversify providers, or make the speed / safety / language experience itself the moat?

**Legal / medical liability boundary.**
As it grows, is a "not medical advice" disclaimer enough? Retention features (calendar, reminders) shift the product toward "health tool" positioning — which raises the liability bar.

---

## Sources

Competitive research (July 2026):
[Doctronic](https://www.doctronic.ai/childrens-symptom-checker/) ·
[Ubie](https://ubiehealth.com/care-options/pediatric-urgent-care) ·
[Jenova AI Pediatric Advisor](https://www.jenova.ai/en/resources/ai-pediatric-advisor) ·
[Huckleberry pricing](https://huckleberrycare.com/pricing) ·
[Kinedu](https://www.kinedu.com/) ·
[TheParentZ](https://www.theparentz.ai/) ·
[Ada / Buoy / K Health analysis (iatroX)](https://www.iatrox.com/blog/patient-facing-ai-health-tools-2025-ada-khealth-buoy-aide-mirror-nhs) ·
[Annelik Yolculuğu (T.C. Sağlık Bakanlığı)](https://annelikyolculugu.saglik.gov.tr/) ·
[Babysfer](https://babysfer.com/)
