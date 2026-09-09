# Vision Document: Merit
*App name decided: **Merit** (formerly the "badge" working title, used throughout earlier mockups in this doc and screens-and-flows.md — not worth re-rendering every exploratory reference retroactively). Status: early concept / pre-UX, now moving into build. Last updated: Sept 8, 2026.*

**Brand identity (decided):** logo mark is a medal-and-ribbon shape — a violet circle (#AFA9EC) with mint/teal (#5DCAA5) ribbon tails, and a tone-on-tone "M" monogram (a darker violet fill on the lighter violet circle) rather than a bold contrasting letter, so the medal shape reads clearly at small sizes (app icon) while the monogram still does real branding work at larger sizes (splash screen, marketing). Implemented in-app as `src/components/Logo.tsx`, shown on the child home screen next to the "Merit" wordmark.

**Category naming (decided):** the two core categories are called **"Expected"** (unpaid, non-negotiable responsibilities — replaces the earlier working term "table stakes") and **"Gigs"** (optional, paid work). "Must(s)" was considered and rejected for feeling too forceful/strict.

---

## 1. Vision Statement

Help children build **work ethic, responsibility, and financial literacy** by clearly separating what's *expected* of them (school, chores, practice — the "Expected" side of being part of a family) from what's *earned* (optional "gigs" that add value at home and, later, in the community). As kids complete gigs, they build real money-management habits: earn, decide how much to spend vs. invest, and understand *why* the distinction between expected effort and paid effort exists in the first place.

Parents run the household through the app in v1 (setting schedules, expectations, gigs, and payouts); the long-term vision is a child-facing experience layered in as trust and independence grow.

---

## 2. Problem This Solves

- Parents currently stitch together 2–3 separate tools to do this: a family calendar/chore app (Cozi, OurHome) for scheduling and chores, a fintech app (GoHenry, Greenlight, BusyKid) for allowance/earning, and a spreadsheet or mental model for "how much should I actually pay for X."
- Most existing apps treat *all* completed tasks — chores and "extra" work — as equally payable, which blurs the lesson that baseline responsibility isn't a paid transaction. Few products make that distinction a first-class, explicit teaching moment.
- Debit-card-first fintech apps (Greenlight, GoHenry/Acorns Early, BusyKid) implicitly push toward giving young kids spending cards and real banking rails before many parents (especially of a 6–9 year old) are ready for that — both practically and philosophically.
- Scheduling (school, extracurriculars, practice) and responsibility/earning are treated as unrelated problems today, even though a child's "free capacity" for gigs is really a function of their calendar.

---

## 3. Target Users

**Primary user (v1): The parent.**
- Household decision-maker who sets up the child's profile, schedule, expectations, and gig economy.
- Approves/vouches for completion of both expected activities and gigs (v1 has no independent child login — this also appeals to parents actively limiting kids' screen time).
- Likely persona to start: parents of elementary-age kids (roughly 6–10), tech-comfortable, already using Google Calendar to manage family logistics, values-driven about instilling work ethic and financial literacy early (not just "give them a card and let them shop").

**Secondary / design target: the child.**
- Initial design target is an 8-year-old girl, with the product expected to iterate as she (and a cohort of similarly-aged kids in the founder's community/network) ages — plus a 4-year-old as a forward-looking lens on how the "expected" list and gig complexity need to flex by age.
- No separate login or account for the child in v1 — they interact with the app on the parent's device through their own profile, at specific touchpoints with the parent (reviewing the day together, celebrating an approval together) rather than through independent, unsupervised browsing. This is a deliberate design principle, not just a technical limitation: it keeps the child's screen time bounded and mediated by the parent, which directly appeals to parents actively limiting screen time for growing children.

**Future user (post-v1): The child as a constrained, parent-governed account holder** — likely gated behind COPPA-compliant consent flows once a direct child experience is built.

**Explicitly out of scope for v1:** teens/independent spenders, community/neighborhood gig marketplace participants, any third-party (non-parent) approvers.

---

## 4. Product Concept

### Core loop
1. **Setup:** Parent creates child profile(s), imports/builds a weekly-monthly schedule (school, extracurriculars, practice/study blocks) — first integration target is **Google Calendar** (hypothesis: most parents already manage family logistics there).
2. **Expected:** Parent selects age-appropriate recommended responsibilities (daily/weekly chores, homework completion, practice). These are *never* paid — the app explicitly frames and explains why.
3. **Gigs:** Once Expected is on track, the app surfaces optional Gigs, starting in-home. **Gigs carry no visible dollar value (decided).** Instead, the child picks an active goal first (see step 4), and the app backs into what each Gig is worth toward that specific goal — the child sees progress ("3 gigs to go," a percentage, a filling progress bar), never a raw dollar figure per task. The parent still sees the real dollar math behind the scenes (for their own tracking and for verbal financial-literacy conversations), but it's not the primary on-screen unit for the child.
4. **Goal-first earning:** The child selects (or proposes, parent-approved) a goal — a toy, an amusement park trip, a restaurant outing, etc. — with a real-world cost the parent enters. Completing Gigs advances a progress bar toward that goal rather than filling a generic cash balance. This replaces the earlier "piggy bank" balance concept as the primary v1 model.
   - **Multiple goals (decided): queued, not concurrent.** One goal is "active" at a time; a wishlist of future goals waits behind it in order. All gig progress goes to the active goal; when it's reached, the next queued goal automatically becomes active. Queue order is changeable at any time (a simple position value on each goal, not a backend complexity concern) — still open whether the child, the parent, or both can reorder it. True concurrent goals (splitting a single gig's value across two simultaneously-active purchase goals) is deliberately deferred — it requires allocation ratios and multi-bar tracking that add real complexity for limited payoff at this age. Worth revisiting for an older-kid "prioritization" feature later.
   - **Automatic investment default (decided, in v1): a "pay yourself first" skim.** A fixed percentage (parent-set, suggested default ~10%) of every gig's earned value is automatically routed to a running Future Fund *before* the remainder counts toward the active goal's progress. This is a single global percentage, not a second goal-splitting system, so it's low complexity to build — and it directly teaches the spend-vs-invest habit by default rather than as an optional end-of-loop choice. Future Fund balance is parent-tracked manually in v1 (no brokerage integration).
   - **Future Fund milestone prompt (decided):** at a parent-set threshold (e.g., $100), the app surfaces a prompt suggesting the parent consider moving the Future Fund balance into a real investment vehicle — framed *educationally* (custodial Roth IRA, custodial brokerage account), not as a specific fund or brokerage recommendation. Notably, a custodial Roth IRA requires the account holder to have earned income, and money a child earns from Gigs (real work, parent-paid) can plausibly qualify — a genuinely strong differentiator worth researching further (parents may want to keep basic records of gig work for this reason). Naming a specific fund or brokerage edges into regulated investment-advice territory (Greenlight, for instance, operates its investing feature through a registered investment adviser, Greenlight Investment Advisors LLC) — v1 should stay educational/general and leave the actual account-opening decision to the parent, not automate or specifically recommend it.
5. **Empty state → setup entry point:** When a child has no active goal, the Gigs section shows a "Pick a goal to start earning" prompt instead of a task list — this becomes the natural entry point into the goal-and-gig setup flow rather than a separate, hidden setup screen.
6. **Payoff:** When the active goal is reached, the parent fulfills it in the real world (buys the toy, books the trip) — tracked manually by the parent in v1 (no brokerage/payment integration yet).
   - **Reward flexibility:** two distinct reward types remain relevant:
     - *Purchasable goals* (toy, event ticket, restaurant): cost entered by the parent, Gigs earn progress toward it, dollar math happens underneath but isn't the child-facing unit (see point 3 above).
     - *Trust/readiness rewards* (e.g., getting a dog): not really "purchased" with Gig progress — better modeled as a separate, non-monetary milestone track unlocked by sustained consistency on Expected duties (a streak), which reinforces the lesson that reliability on unpaid responsibilities still earns something real, just not a goal purchase.
   - **Academic achievement (older kids, future iteration):** once real grades enter the picture, a parent-set bar (e.g., "at least an A- in every class") should live in the *non-monetary trust/streak track*, not the paid-gig economy — this is backed by research, not just intuition (see Section 6/Risks: paying for grade outcomes doesn't reliably work, but paying for the inputs that produce them does). A grade threshold becomes an "achievement streak" alongside the "responsibility streak," both feeding the same milestone-reward pool.
7. **Gamification + plain-language money lessons:** Woven through the experience to explain (a) why Expected work isn't paid, (b) why Gigs move you toward a goal, (c) why a slice always goes to the Future Fund first, and (d) the real dollar cost behind the goal, discussed with the parent even though it's not the primary in-app display unit.

### Deliberately tabled for later iterations
- Child-facing login/independent account.
- Gigs outside the home (neighborhood/community) and the earning/verification process that implies.
- Real brokerage/investment account integration (e.g., Schwab) — v1 is parent-managed offline.
- Any debit card or money-movement rails.

---

## 5. Competitive Landscape

The market splits into four clusters. No single competitor combines *all* of: schedule-aware expected/earned separation, gig-based earning, and a debit-card-free, parent-only v1.

### A. Chore + allowance fintech apps (debit card, banking rails)
| App | Price | Chores/Allowance | Gigs/earning model | Investing | Notes |
|---|---|---|---|---|---|
| **Greenlight** | $4.99–$14.98+/mo for family (Max plans from ~$10.98/mo) | Chore tracking, automated allowance | Allowance tied to chores; not framed as "earn vs. expected" | Yes — kid-directed investing with parent approval on every trade, "Level Up" financial-literacy game | Market leader; $2.3B valuation, 6M+ families; heavy safety/location features bundled in too |
| **GoHenry (US: Acorns Early)** | ~$5–8/mo per child or up to 4 kids; $12/mo bundled w/ Acorns Gold | In-app task lists, recurring/one-off chores | Chores pay allowance; "Money Missions" gamified lessons | Limited (Acorns ecosystem) | Rebranded GoHenry→Acorns Early in the US (2023 acquisition); UK stays GoHenry |
| **BusyKid** | ~$4/mo (billed annually) | Pre-set chores/allowance by age, multi-parent approval | Chores drive pay; allowance-without-chores option too | Yes, basic investing | Positions itself as more than a chore app |
| **FamZoo** | Subscription, flexible | Robust chore/task lists tied to fund transfers | Chore-based; can add budgets/loans as kids grow | No native investing | Praised for flexibility as kids age into more complex money concepts |
| **RoosterMoney** (UK-centric) | Free tier; Rooster+ ~$3/mo or ~$19–26/yr | Star charts (young kids) → chores/"jobs" (Rooster+) | Chores or general incentives (homework, sharing) pay into spend/save/give "pots" | No | Strong free tier; UK-first |
| **iAllowance** | $3.99 one-time | Stars → currency conversion | Chore-driven | No | Older, one-time-purchase model; no cloud/social features |
| **Dinner Table Economy** (formerly GravyStack) | Free app w/ paid coaching community | "Home Gigs" system explicitly reframes chores as earning opportunities | **Closest conceptual competitor on paper — but see note below.** Positions against "allowance" directly; dedicated "gigs"/"jobs" language, Spend/Save/Share jars | No native brokerage, ledger-only | Backed by $5.2M seed. **Corrected after reviewing actual product screenshots (not just store copy):** the delivered product is a whole-*family* operating system, not a single-child experience — dashboard is organized around "Family Meetings," "Family Goals," "Family Leadership," a shared "Family Jobs" table listing every kid's job count side by side, and a "VC Snapshot" that scores the family numerically (e.g., 33/100) across categories like "Material Value" and "Emotional Energy," styled like a corporate engagement-survey dashboard. There's a "Community" tab and a 100+ item "Education Center" resource library, plus what looks like a parent-coaching/certification business behind it (see Section 2 research). No visible kid-facing surface exists in any of these screens — everything is built for the parent/"family leader" to administer, with vocabulary borrowed from performance management (Meetings, 1:1s, streaks, admin badges, autosave). This is meaningfully different from "an app my 8-year-old would enjoy opening." |

### B. Gamified task/behavior apps (not money-first)
| App | Price | Model |
|---|---|---|
| **Joon** | ~$12.99/mo or $89.99/yr | Chores become "Quests"; child cares for a virtual pet with coins earned from tasks, redeemable for parent-set real-world rewards (not necessarily cash). Strong focus on ADHD/neurodivergent kids and reducing parental nagging. Separate parent + child apps. |

### C. Family organizer / calendar apps (scheduling, no earning layer)
| App | Price | Model |
|---|---|---|
| **Cozi** | Free (ads) / Gold ad-free tier | Shared calendar, shopping lists, basic chore lists — no earning/reward system |
| **OurHome** | Free w/ purchases | Tasks/chores with reward-and-goal motivation, calendar, grocery lists — closer to a hybrid, but rewards are generic, not a structured earn/invest system |
| **FamilyWall** | Free / ~$4.99/mo for integrations | Calendar, messaging, task lists |

### D. Custodial investing apps (investing-first, no chores/gigs layer)
| App | Model |
|---|---|
| **EarlyBird** | Parent (+ family/friends) fund a UGMA custodial brokerage account with gifted contributions; social/gifting-driven, not earnings-driven |
| **Acorns Early / Stockpile / Stash-style products** | Custodial brokerage wrapped into broader consumer investing apps |

### Market sizing context
The teen/kids banking app category is a real, funded, growing space: one recent market report sizes the **global "Teen Banking App" market at ~$1.2B in 2025, projected to reach ~$5.7B by 2034 (17.9% CAGR)**, driven by financial-literacy interest, smartphone penetration, and parents wanting controlled digital alternatives to cash. Category leaders (Greenlight, Acorns Early) are well-capitalized (Greenlight alone raised at a $2.3B valuation), which raises the bar for any new entrant competing head-on as "another chores + debit card app."

### Where the whitespace is
1. **Explicit expected-vs-earned pedagogy as the core mechanic**, not a footnote. Competitors let parents pay for anything, including things like "brush your teeth" — this idea's differentiator is a structural, non-negotiable line between "Expected" and paid "Gigs", taught explicitly to the child.
2. **Schedule as the source of truth.** No competitor starts from "what does this kid's week actually look like (school, extracurriculars, practice)" and derives realistic capacity for expectations and gigs from that. Google Calendar-first onboarding is a genuinely underused wedge.
3. **No debit card / banking rails required to start.** Every major fintech competitor's business model leans on the card (interchange revenue). Skipping that in v1 lowers regulatory/compliance overhead (no Sutton Bank/Community Federal-style banking partnership needed) and may appeal to parents of *younger* kids who aren't ready for a card but still want the earning/values lesson — but it also removes a revenue lever competitors rely on and a "cool factor" (a card of their own) that drives some of their engagement.
4. **Genuinely child-delightful AND single-child-focused, at the same time as real earning/investing mechanics — nobody currently does both.** Joon wins on kid delight (a whole separate pet-game app for the child) but has shallow money/earning depth (rewards are parent-defined real-world perks, not a structured earn/save/invest system). Dinner Table Economy has the philosophical framing right (jobs vs. gigs, work-ethic-first) but delivers it through what is, based on actual product screenshots, a whole-*family* operating system built for the parent to administer — meetings, streak dashboards, engagement-survey-style scoring, a community tab, a resource library — with no visible kid-facing surface at all. There's real room for something built around one child's world (not the whole family's operating rhythm) that a kid would actually want to open.

---

## 6. Risks

**Competitive / market risk**
- Well-funded incumbents (Greenlight, Acorns Early) already bundle chores + earning + investing + gamified lessons, and could add a "Expected vs. Gigs" framing feature quickly if it resonates.
- Dinner Table Economy already owns "gigs" positioning and a parent-coaching community moat that's hard to out-content.
- Family calendar apps (Cozi, OurHome) are entrenched habits; asking parents to adopt *another* calendar-adjacent app is a real switching-cost risk unless Google Calendar import removes the double-entry problem.

**Product / behavioral risk**
- Without a debit card or direct child interaction, the "gamification" and motivation loop depends entirely on the parent relaying it — engagement could be weaker than apps where the child directly experiences quests, cards, or a companion pet (see Joon).
- Manual, offline investment tracking (no Schwab-style integration in v1) is a trust and accuracy burden on the parent and could feel like a step backward compared to competitors' one-tap investing.
- Risk that "Expected never earns money" becomes a friction point with some parents' existing philosophies (some intentionally pay for everything; some pay for nothing) — the product is making a values bet, not a neutral one.
- **Paying for grade outcomes specifically is well-studied and mostly doesn't work.** Harvard economist Roland Fryer's randomized trials across 250+ urban schools found financial incentives improve achievement when tied to *inputs* (homework completion, attendance, books read) but not when tied to *outputs* like grades or test scores — kids often don't know how to convert the incentive into the behavior that produces the outcome. This supports keeping any future "grade threshold" reward in the non-monetary trust/streak track rather than the paid-gig economy.

**Regulatory / privacy risk**
- Even with parent-only accounts, the app stores a minor's data (schedule, performance, money habits) — COPPA considerations likely apply and should be scoped early, especially before any future child-facing login.
- If gigs ever involve real money changing hands (even parent-to-child), state-level rules around minors and earnings/taxes could eventually matter, especially once "outside the home" gigs are introduced.

**Execution / scope risk**
- The full vision (calendar integration + expectations engine + gigs marketplace + virtual balance + redeem/invest split + gamified education layer) is a lot of surface area for a v1. Sequencing which piece proves the core hypothesis first (likely: expected vs. earned framing + basic gigs/payout tracking) before layering calendar import and investment education matters a lot for scope control.
- Google Calendar as the first integration is a reasonable bet but unvalidated — worth confirming with the target parent network before building it, since some families coordinate schedules in shared docs, texts, or school portals instead.

**Monetization risk**
- Most direct competitors monetize via debit card interchange + subscription. Without a card, this product likely needs to rely on subscription alone (or a future card/investing partnership), which is a smaller, less proven revenue lever in this category.

---

## 7. Open Questions (to revisit as the idea develops)
- What's the MVP wedge — is it the calendar/expectations engine, the gigs/earning loop, or both together?
- How much of Dinner Table Economy's "gigs" model should be treated as validation vs. a reason to differentiate harder?
- At what point (age/trust threshold) does a child-facing experience get introduced, and what would it need to look like given many parents' screen-time concerns?
- How will "value of a gig" be calibrated by parents now that it's derived from the goal rather than set per-gig directly? **Resolved:** the parent picks a relative effort tier per gig (Quick / Medium / Big job), not a dollar amount or percentage — the app combines that tier with whatever goal is currently active to compute the percentage shown to the child. Content library suggests default tiers by age/task; parent can override.
- What does the community-testing plan (parents/kids in your network) look like, and what would you want to learn from it before committing to UX?
- Does the child choose goals from a parent-curated wishlist, or propose their own for approval? **Partially resolved:** goals are queued, not concurrent (see screens-and-flows.md) — one active goal at a time with a wishlist behind it. Still open: parent-curated only, child-proposed with approval, or both.
- Now that dollar amounts are hidden from the child by default, at what point (if ever) does the app reveal them directly to the child for the financial-literacy lesson — always via the parent conversation, or a later "reveal the math" screen as they age?

---

## 8. Next Steps
- [ ] Deeper teardown of Dinner Table Economy specifically (closest positioning match)
- [ ] Validate the Google Calendar hypothesis with a few parents in the target network
- [ ] Decide MVP scope/sequencing (see open questions)
- [ ] Draft the "expected vs. earned" explanation copy/framing — this is the pedagogical core and worth nailing in plain language early
- [ ] Move into UX design once the above is settled
