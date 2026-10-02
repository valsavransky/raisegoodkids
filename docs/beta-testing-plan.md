# Beta Testing & Feedback Plan: Trekker
*Companion to vision-doc-kids-goals-app.md and screens-and-flows.md. Renamed from the Sept 8, 2026 "Merit" version — content substantially revised, not just a find-and-replace, since the content-library and feature-readiness pictures have both changed materially. Last updated: Oct 1, 2026.*

---

## 1. Readiness checkpoint: what needs to work before anyone outside your household sees this

Same bar as before — **a family needs to be able to experience the full core loop through a goal completion**: setup → daily self-marking → Gigs → goal progress → the goal-achieved celebration. That's still the real "aha" of the product.

**This is now clearly met, and then some.** Since the Sept 8 version of this plan, the core loop has gone from "exists" to "polished": Today's Trail (the winding-path home screen), the This Week grid, grade-aware goal recommendations, goal photos, a real synthesized fanfare on Goal Achieved, Future Fund (now optional, configurable), badge-unlock audio, Sign in with Google, and a daily reminder notification are all shipped and confirmed working on-device. The one open build item is **iOS testing** — still blocked on getting Xcode installed on your husband's Mac. Practically, that means **wave one is Android-only** until that's resolved; nothing about the content or core loop blocks it.

**Still fine to ship without, for wave one:** history/progress across past weeks (backlog — a parent can't yet look back at prior weeks, only the current one), the excusable-vs-always-required split, multi-child management, "today's recap," the age-progression engine. None of these are load-bearing for the core question — does separating Expected from Gigs, with a goal-first earning model, actually motivate a kid and feel meaningful to a parent.

## 2. Content library coverage — the big change since Sept 8

**The Sept 8 plan restricted wave one to 3rd/4th grade kids specifically**, because that was the only grade band with real content. That restriction is now lifted: **all four planned grade bands are authored** — K-2nd, 3rd/4th, 5th/6th, and 7th/8th — each with real suggested Expected items and Gigs, not an empty "add your own" fallback. The bands aren't just scaled difficulty: K-2nd skews "with help" and drops the Big Job tier; 5th/6th introduces Gigs "graduating" to Expected (trash, lunch-packing); 7th/8th is the most independent band, with a full load of laundry graduating all the way to Expected.

**Practical effect: wave one can now recruit across K-8th grade**, not just 3rd/4th. The content-library gap that drove the original recruiting filter no longer exists. (High school, 9th-12th, is still unauthored — not a wave-one concern.)

## 3. Staged rollout

1. **Private alpha — your own household, 1–2 weeks.** Catch confusing or broken moments before anyone else sees them. With the core loop this much more built out, this is more "confirm it still feels right end to end" than "find obvious breakage."
2. **Close-friends beta — 3–5 families, now open to K-8th grade kids (not just 3rd/4th), Android for now.** Run for **at least 3–4 weeks** — shorter and most families won't naturally reach a goal completion.
3. **Wider school-community beta** — once wave-one feedback is incorporated, and once iOS is unblocked (a meaningful share of any wider group will be on iPhone).

## 4. Feedback mechanism — three distinct moments, not one form

### A) Invite message (once, before a family starts) — NOT a survey

Same reasoning as before: no form, no survey link, no re-explaining the app (Welcome already does that). One combined text/email at invite time covering only what the app can't say for itself.

**Template:**
> Hey! I've been building an app called Trekker — it walks you through what it's about when you open it, so I won't repeat all that here. Two things worth knowing first: it's still early, so expect some rough edges — that's exactly what I'm hoping to catch, so please don't hold back if something's confusing or broken. And it's meant to be something you sit down and use *with* [kid], more like a little shared check-in than an app you just hand over — that's intentional, not a bug. No timeline pressure, just use it as it comes up over the next few weeks and text me anytime you've got a reaction. Oh, and random question while I have you — have you tried other apps or ways to teach [kid] about this kind of stuff before? Curious what worked or didn't.

Same deliberately-dropped intake questions as before (tech-savviness, current allowance handling) — moved to the exit survey, where comparative/structured answers are more useful.

### B) Lightweight in-app feedback (ongoing, low-friction)

**Still not built** — this hasn't changed since Sept 8. A "Send feedback" option in parent settings and a one-tap pulse check after a goal completion ("How did that feel for your family?") remain designed-on-paper, not shipped. Given everything else that's landed since Sept 8, this is worth a look before wave one starts if it's cheap to add — right now a family's only feedback channel is texting you directly, which works at 3-5 families but is easy to lose track of without a dedicated place to log it.

### C) Exit survey (whenever a family reaches a natural stopping point)

Same candidate-pool approach as before — pick ~5 questions per actual send, not all of them. Questions unchanged in substance; just swap "Merit" for "Trekker" in anything you send.

## 5. How you'll actually know when to check in — this has changed

The Sept 8 plan flagged two problems with no good solution: no admin dashboard, and no way to know when a specific family hit a goal. **The first one is now solved; the second deliberately isn't.**

**What's new: a private, anonymous usage dashboard.** `/admin?key=...` (behind an `ADMIN_KEY` you set in Railway) now shows installs, active today/week/month, a 14-day activity chart, a setup-to-first-use funnel, day 1/7/30 return rates, feature usage breakdowns, and a feed of recent events (app opened, setup steps, Expected checked, gig completed, goal added/reached, badges, reminder toggled, Future Fund set, and more). This is genuinely useful for the thing the old plan couldn't do at all: **sanity-checking whether your 3-5 families are using the app at all**, in aggregate, without having to ask.

**What's still true: it can't tell you *which* family did *what*.** The dashboard is anonymous by design (a random install id, no names, no emails, no typed content — a parent can turn it off entirely in Settings) — that's a deliberate privacy choice, not a gap to fix. A dedicated "email me when a specific beta family's child hits 100% on a goal" notification was explicitly **decided against for MVP on Sept 29** (kept on the backlog in case beta testing changes your mind). So for knowing *who* reached a goal, or *who's* gone quiet, you still need the human channel — the casual check-in text — same as the Sept 8 plan. The dashboard is a complement to that (a way to notice "everyone's gone quiet" even before you'd think to text), not a replacement for it.

**Duration guidance (unchanged): ask testers for 2 weeks upfront**, light informal check-in at the 2-week mark, full exit survey whenever a family reaches a natural stopping point (a goal completion or genuine disengagement) rather than a fixed calendar date. Still worth coaching testers toward a small first goal so 2 weeks has a real shot at containing a full goal-completion cycle.

**Delivery tone, core-mechanic/engagement/outcome/open-ended question pools:** unchanged from the Sept 8 plan in substance — see that version's full candidate list if you need the exact wording; just swap the app name.

## 6. Not yet designed
- The in-app feedback UI (Section 4B) — still the single biggest gap between this plan and what's actually built.
- Where/how the intake and exit surveys are delivered — in-app vs. an external form — still an open decision, now slightly lower-stakes given the admin dashboard covers some of what a built-in survey tool would have.
- iOS testing path (Simulator vs. a paid Apple Developer Program device build) — blocks wave one from including any iPhone families until resolved.
