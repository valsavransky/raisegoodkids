# Screens & Flows Spec: "badge" (working name)
*Companion to vision-doc-kids-goals-app.md. This document tracks concrete screen-level decisions as they're made, for handoff to design and to Claude Code. Last updated: Sept 8, 2026.*

---

## Design system decisions so far

- **Device/auth model (clarified, not previously explicit):** one parent account holds one or more child profiles. The child has no separate login or credentials in v1 — kid-facing screens (home screen, goal picker, badge shelf, celebrations) are used on the parent's device through the child's profile. **Refined further:** the child isn't meant to browse the app independently whenever they want — they interact with it *as a touchpoint with the parent*, at specific moments (e.g., reviewing today together, celebrating an approval together). This is a deliberate design principle, not just an auth limitation: it keeps screen time bounded and mediated by the parent, which is itself part of the product's appeal to parents managing screen time (see vision doc, Section 3).
- **Navigation model (resolved):** the parent initiates a "Check in with [Child]" session from their own view — this is how the child's home screen actually opens, rather than the child having their own app icon to tap. Once inside a check-in session, the existing Home / Badges / Goal navigation (screen 2) remains valid as designed, since the parent is present for the session. A practical side benefit: celebratory moments (badge unlocks, goal achieved, decline feedback) don't need push notifications firing at arbitrary times — they simply surface at the next check-in, consistent with the bounded-session model. The entry point itself is now designed — see screen 18.
- **App name (placeholder):** "badge," lowercase wordmark.
- **Category names:** "Expected" (unpaid) and "Gigs" (paid, but see below — no dollar amounts shown to the child).
- **Dual voice:** kid-facing screens are playful, first-person, exclamatory ("You did it!"); parent-facing screens are calm, competent, efficient, no exclamation points.
- **Color coding (consistent across the app):** teal/aqua = unpaid, trust-based (Expected streaks). Amber/orange = paid, goal-progress (Gigs). Violet = Future Fund / investing. Colors should stay consistent everywhere these concepts appear — a badge, a progress bar, an icon — so a kid can tell the "economy" at a glance without reading.
- **Icon rule (revised):** checkmarks are no longer reserved exclusively for parent confirmation — self-marked Expected items now use a green checkmark (with a pop-in animation) for their done state instead of the originally-specced plain circle → dot-filled circle, per the user's UX feedback once the approval-queue simplification made "parent confirmed" and "child self-marked" less sharply distinct moments in practice. Checkmarks are still never used as a *category* marker, though — category icons remain the flame (teal, Expected) and the coin (amber, Gigs), used consistently everywhere those categories appear (home screen rows, badge unlocks). A fourth color, **magenta/pink with a star icon, is reserved for rare "character" badges** (e.g., persistence after a decline) — distinct from the regular streak (teal) and gig (amber) badges, used sparingly so it keeps its special-occasion weight.
- **Badge/achievement motif:** celebratory unlock moments (confetti-style dots, bounce) for both Expected streaks and Gig milestones — validated by the founder's daughter's real engagement with badge/confetti mechanics in school reading and math apps. Celebration is the proven trigger, not the money.
- **No monetary value shown to the child on individual Gigs.** Gigs show percentage progress toward the active goal instead (e.g., "+8%"). The real dollar math happens on the parent side.
- **Approval model (revised): parent marks gigs done directly during check-in, no separate approval queue.** Expected items are self-marked by the child (single tap, feeds the streak immediately) — no per-item parent approval, since nothing financial is at stake. Parents get a light "today's recap" view to correct anything wrong after the fact, rather than gatekeeping in real time. Gigs count toward goal progress the moment they're marked done — since there's only one user type (parent) and they're present for the check-in session, a deferred approval step (screen 8, and the decline/retry flow in screens 9-10) added a step without adding real verification value. Screens 8-10 below are kept as historical design work in case a deferred-approval mode becomes useful later (e.g. if a parent isn't present for a session), but are not part of the v1 build.
- **Gating (revised): a soft confirmation, not a hard lock.** Gigs used to be locked until all of today's Expected items were self-marked done, enforcing "table stakes first" structurally. Revised because some Expected items are legitimately impossible on a given day (nothing to set the table for, no dishes to put away) with no way for a hard lock to distinguish that from actually skipped chores. Now the remaining count stays visible, and starting a gig with Expected items still outstanding asks the present parent to confirm ("[Child] still has N Expected items left today. Let them start a gig anyway?") — putting the judgment call with the parent rather than the app. Trade-off: this only holds the line if parents sometimes say no; a parent who reflexively confirms every time gets the old unlocked-always behavior.
- **Excuse logic (v1 scope decided): ship simple first.** The full excusable-vs-always-required split (screens 16–17) is fully designed and ready to build, but is a fast-follow, not part of the initial build. **V1 ships a single all-or-nothing "excuse today" toggle** (auto-triggered by birthday/holiday, or manually set by a parent) that excuses every Expected item for the day at once — no per-item excusable property, no mixed-state list. Screen 7's setup mockup does **not** need the excusable/always-required toggle for v1 as a result. Revisit the split version once the core loop is live.
- **Goal queue reorder permission (resolved, default): parent-only for v1.** Consistent with parent authority elsewhere (approvals, setup) — child-driven reordering can be considered later if it seems like a meaningful moment of agency worth adding.
- **Character badge scope (resolved, default): kept narrow.** The magenta "character" badge stays scoped to persistence-after-decline only for v1, rather than expanding into other character moments — protects its special-occasion weight, per the earlier badge-motivation research discussion.
- **Recap correction behavior (resolved, default): streak breaks, approved Gig progress stands.** If a parent corrects a false Expected claim in "today's recap" after Gigs already unlocked and a Gig was approved off the back of it, the streak resets to reflect genuine reliability, but already-approved Gig progress is not clawed back — reversing an approved reward after the fact risks feeling arbitrary or punitive for something the child may not have caused.

---

## Core loop (see diagram from the design conversation)

Setup → daily loop (child completes a task) → parent approval → branches into:
- **Expected** → builds a streak (no payout)
- **Gig** → adds progress toward the active goal (no dollar amount shown)

Both converge on a payoff step: redeem the goal (parent fulfills it in real life), or hit a Future Fund milestone (see below).

---

## Screens designed so far

### 1. Badge unlock moment (kid-facing)
**Purpose:** celebratory feedback when an Expected streak milestone or a Gig milestone is reached.
**Key elements:**
- Circular badge icon (flame for streaks, teal), confetti dots on unlock
- Title + subtitle (e.g., "7-day streak" / "Expected badge earned")
- Gig-completion row: coin icon (amber), gig name, "Gig completed," a percentage gained (e.g., "+8%"), and a visual progress bar showing cumulative progress toward the active goal (e.g., "60% toward trip to Six Flags") — the bar and the percentage-gained number work together, not either/or.

### 2. Child home screen (kid-facing)
**Purpose:** the primary daily screen — today's Expected items, available Gigs, and goal progress at a glance.
**Key elements (top to bottom):**
- App wordmark + profile icon
- Active goal card: goal name, progress bar (amber fill), "X gigs to go" copy
- "Expected today" section header + streak indicator (flame icon, teal)
- Expected list: rows with a plain circle (not done) → dot-filled circle (self-marked done, teal) — never a checkmark; tapping self-marks the item done immediately, no parent approval required per item
- "Gigs available" section header
- Gigs list: rows with a coin icon (amber, category marker) and a percentage toward the goal (e.g., "+8%"), no dollar amounts. **Locked (decided):** the Gigs section shows a locked state (lock icon, "Finish today's Expected to unlock gigs," progress like "2 of 3 done") until every Expected item for the day is self-marked done; it unlocks into the normal list once complete.
- Bottom nav: Home / Badges / Goal

**Open item:** what this screen shows when there's no active goal — resolved by screen 3 below (empty state = goal picker). Also open: a parent override to "excuse" a day's Expected so the Gigs lock doesn't feel punitive on a legitimately busy day (illness, late practice) — not yet designed.

### 3. Goal picker (kid-facing, also the empty state)
**Purpose:** where a child picks or manages their queued goals; doubles as the entry point into goal setup when no goal is active.
**Key elements:**
- Prompt: "Pick a goal to start earning"
- Queued goal list: one marked "Active goal" (accent border, checkmark), others marked "Up next" / "Waiting in line," in order
- "+ Add a new goal" action
- Future Fund summary row (violet icon, "10% of every gig goes here first")

**Decisions locked in:**
- **Multiple goals are queued, not concurrent.** One active goal at a time; a wishlist waits behind it. No splitting a single gig's value across two simultaneously-active goals (deferred — real complexity, limited payoff at this age).
- **Queue order is changeable** by simple reordering (a position value per goal) — trivial on the backend. Still open: who can reorder it — child, parent, or both.
- **Future Fund is a fixed "pay yourself first" skim** (parent-set percentage, suggested default ~10%) taken off every gig's earned value before the rest counts toward the active goal. Single global percentage — not a second goal-splitting system.
- **Future Fund milestone prompt** (e.g., at $100): surfaces a suggestion to the parent to consider a real investment vehicle, framed *educationally* — a custodial Roth IRA (kids' gig earnings may qualify as the "earned income" the IRS requires for one) or a custodial brokerage account — but never a specific fund or brokerage recommendation, since that edges into regulated investment-advice territory. Not yet mocked as a screen.

### 4. Parent setup, step 1 of 3: child profile
**Purpose:** create a single child's profile (full flow is one child at a time, not a multi-child wizard).
**Key elements:**
- Back arrow + "Add a child" + step indicator ("Step 1 of 3")
- Avatar picker (5 simple icon-based options, no photo requirement)
- Name field
- Birthday field
- Grade in school (optional) — feeds the age/grade content library for suggested Expected items and Gigs (see below)
- Helper text explaining why grade is asked
- Continue button

**Decision:** a content library of age/grade-appropriate Expected items and Gigs will back the suggestions shown later in setup — this is backend/content work, not just UI, and needs its own content-authoring effort (see open questions).

### 5. Parent setup, step 2 of 3: schedule import
**Purpose:** import or manually build the child's weekly schedule (school, extracurriculars, practice) to inform realistic Expected/Gig capacity.
**Key elements:**
- Back arrow + "Set up schedule" + step indicator ("Step 2 of 3")
- Icon + short explanation of why (realistic Expected/Gig suggestions)
- Primary button: "Connect Google Calendar"
- Secondary action: "Skip and add manually"
- Privacy reassurance note: only event titles/times are read, nothing else stored

**Not yet designed:** the screen both paths converge on — a schedule review/tagging screen where the parent confirms or tags each event (school / extracurricular / practice) or excludes it, and adds anything missing if they skipped the calendar connection.

### 6. Parent setup, step 2 of 3 (continued): schedule review/tagging
**Purpose:** the screen both the "connect calendar" and "skip and add manually" paths converge on — parent confirms or corrects the category of each event.
**Key elements:**
- Back arrow + "Review schedule" + step indicator ("Step 2 of 3")
- Helper text: anything not tagged counts as free time for gigs
- Event list: each row shows event name + recurrence/time, with a category dropdown (School / Extracurricular / Practice / Skip) — pre-filled with a best guess when pulled from Google Calendar, empty/default when added manually
- "+ Add event manually" action (used by both paths — the only way in if calendar was skipped, or to add anything the calendar missed)
- Continue button

**Note:** the "free time" this screen establishes is what later informs realistic Expected/Gig capacity in step 3 — worth keeping in mind when designing that screen's suggestions.

### 7. Parent setup, step 3 of 3: Expected & Gigs setup
**Purpose:** parent selects which Expected items and Gigs apply, pulling suggestions from the age/grade content library.
**Key elements:**
- Back arrow + "Expected and gigs" + step indicator ("Step 3 of 3")
- Helper text noting suggestions are grade-specific, with a toggle-what-applies / add-your-own framing
- Expected list: suggested items with a simple include/exclude checkbox, no numbers or values attached. **Needs updating (not yet reflected in the mockup):** each included item also needs an excusable vs. always-required toggle, since excused days (holiday, birthday, or a manual parent excuse) only make excusable items optional — see screen 16.
- "+ Add custom Expected item" action
- Gigs list: suggested gigs with an include/exclude checkbox, plus an **effort-level selector per gig** (Quick / Medium / Big job) instead of a dollar value — this is the resolved answer to "how is gig value calibrated": the parent picks a relative effort tier, not a dollar figure or a percentage; the app combines that tier with whatever goal is active to compute the percentage shown elsewhere (home screen, badge unlock). Suggested tier defaults come from the content library, parent can override.
- "+ Add custom gig" action
- "Finish setup" button (completes the 3-step flow)

---

## Not yet designed (queued up)
- Multi-child management (family/children list screen, "add another child" entry point — deferred until the single-child flow is fully mapped)

### 8. Parent approval queue (revised: Gigs only)
**Purpose:** the parent's daily counterpart to the child's home screen — reviewing and approving/declining pending Gig completions. Expected items no longer appear here (see Approval model decision above) — they're self-marked by the child and reviewable in a separate "today's recap" view (not yet designed).
**Key elements:**
- Header "Approvals" + pending count badge (e.g., "1 pending")
- List of pending Gigs, each showing: coin icon (amber), gig name, how long ago it was marked done, and the percentage it's worth (e.g., "worth +8%")
- Approve (green check) / Decline (neutral x) icon buttons per row
- A small info note explaining Expected is self-marked and reviewable on the child's profile
- **Not yet designed:** an optional short note field on decline, so the parent can leave specific, constructive feedback (see screen 9 below) instead of a silent rejection.

### 9. Gig declined — gentle feedback (kid-facing)
**Purpose:** what the child sees when a parent declines a Gig. Deliberately not punitive — the goal is "disappointed coach," not an error state.
**Key elements:**
- Muted, neutral styling throughout — no red/danger color, no alarm iconography. A gray-toned mood icon (not a stark "X" or warning symbol).
- Calm title: "Not quite this time" (not exclamatory — this is the one moment in the app that intentionally isn't celebratory)
- The gig name, for clarity on what was declined
- An optional note from the parent (e.g., "The backyard still needs a scoop, try again after school") — falls back to a generic encouraging line if the parent leaves it blank
- A closing encouraging line: "You'll get it next time."
- No confetti, no badge, no streak impact implied — the absence of celebration is the signal, not harsh visual punishment on top of it.

**Design rule this establishes:** decline is the only kid-facing moment in the app without celebratory visual language, but it still uses the same warm, coaching voice as everything else — never shaming, never framed as a failure.
**Resubmission (decided):** declined gigs can be resubmitted — a "Try again" button on this screen sends the gig back to the parent's approval queue.

### 10. Gig resubmitted and approved — "grit" celebration (kid-facing)
**Purpose:** the moment a previously-declined gig gets approved after a retry. Deliberately distinct from a normal Gig-completion celebration — it specifically praises sticking to a commitment despite the earlier setback, not just the task itself.
**Key elements:**
- A special "character" badge (star icon, magenta — see the icon rule above), separate from the regular streak/gig badge colors, confetti on unlock
- Title: "You stuck with it!" with a subtitle naming the specific behavior ("You kept your commitment and tried again")
- Followed immediately by the normal Gig-completion card (coin icon, gig name, percentage gained, progress bar toward the active goal) — the persistence gets its own moment first, then the regular reward mechanics still apply underneath it.

**Open question:** this introduces the idea of a "character badge" category beyond streaks and gig milestones — worth deciding whether to expand this into other character moments (e.g., a first-time-ever gig, helping a sibling) or keep it narrowly scoped to persistence-after-decline so it doesn't dilute into a badge for everything.

### 11. Badge shelf (kid-facing, "Badges" tab)
**Purpose:** the collection view for every badge earned so far, plus visible locked/upcoming badges to motivate what's next.
**Key elements:**
- Header "Your badges" + earned/remaining count (e.g., "3 earned, 2 to go")
- 2-column grid of badge tiles. Earned badges show in full category color (teal flame, magenta star, violet trending-up icon) with the date earned. Locked badges show grayed out (muted icon and text, disabled-fill circle) with a small lock icon and "Locked" instead of a date.

**Two new badge types introduced while designing this screen (not previously specced, added because the shelf needed something to show for "what's next"):**
- **"Big job done"** — tied to the effort-tier system from Expected & Gigs setup (Quick / Medium / Big job); rewards completing a Big Job tier gig specifically, giving the harder tier its own extra recognition beyond the standard percentage progress.
- **"Goal achieved"** (trophy icon) — triggers when an active goal hits 100% and the payoff happens. This is a natural, arguably necessary addition: reaching a goal was always the culmination of the whole loop, but no badge/celebration moment had been designed for it specifically until now. Worth prioritizing this as its own celebration screen (bigger than a standard gig-completion card, likely closer in weight to the "grit" badge) before the badge shelf ships, since it's the biggest moment in the entire app.

---

### 12. Goal achieved — celebration (kid-facing)
**Purpose:** the biggest moment in the app — a queued goal reaches 100%. Bigger and more elaborate than a standard gig-completion or badge unlock, since this is the culmination of the entire loop.
**Key elements:**
- Large trophy icon (amber — goal/gig economy color) with a bounce-in entrance animation, plus an animated confetti burst (falling, rotating pieces across the brand's four accent colors) — noticeably more elaborate than the smaller confetti-dot treatment used on regular badge unlocks, matching the size of the moment
- A "Play the fanfare" button that triggers a short celebratory sound (an ascending four-note chime). Sound is triggered by a tap rather than auto-playing, since browsers generally block audio autoplay without a user gesture — this also turns it into an extra moment of delight the child actively triggers rather than something that just happens to them
- Title: "You did it!" + the specific goal name ("Trip to Six Flags is yours")
- A gentle instruction that this isn't automatic: "Ask a grown-up to make it happen" — sets the expectation that the parent still needs to act in the real world
- A preview of the next queued goal automatically becoming active ("Up next: New bike"), so the loop continues without a dead stop

### 13. Parent: fulfill goal prompt
**Purpose:** the parent-facing counterpart to screen 12 — a reminder to actually make the real-world purchase/trip happen, and a record of having done so.
**Key elements:**
- Trophy icon, child's name, goal name, and how long it took ("reached in 23 days") — a nice small recap moment for the parent
- Short instruction: mark it fulfilled once handled, for the parent's own record
- "Mark as fulfilled" button, plus "I'll do this later" for when real-world delivery (a future trip, say) can't happen right away

**Revised:** "Mark as fulfilled" no longer gates the next queued goal — it activates automatically the moment the current one is achieved (100% reached), not when the parent confirms real-world delivery. Originally decided the other way ("you don't start saving for the next thing until the last one is actually delivered"), but that forced an immediate parent action before a child could keep earning, which doesn't hold up for a goal like a future trip that can't be delivered on the spot. Fulfillment is now just a record, tracked separately via the goal's `fulfilledAt` field and surfaced on the Goal tab, with "Finish up" as the way back to this screen for an achieved-but-not-yet-fulfilled goal.

---

### 14. Parent: Future Fund milestone prompt
**Purpose:** surfaces when the Future Fund balance crosses a parent-set threshold (e.g., $100), prompting the parent to consider moving it into a real investment vehicle. Framed strictly as education, never as a recommendation of a specific fund or brokerage — see the vision doc's note on regulated investment-advice territory (companies like Greenlight operate this feature through a registered investment adviser; this app doesn't, so it stays general).
**Key elements:**
- Violet trending-up icon (Future Fund color), child's name, current milestone amount
- Two educational option cards, side by side in concept (stacked on mobile): custodial Roth IRA (notes the earned-income requirement, and that gig earnings may qualify) and custodial brokerage account (more flexible, no earned-income requirement)
- An explicit disclaimer: general information, not financial advice, consider a financial professional
- Two actions: "Remind me later" and "I've handled it" — both non-blocking, since this is guidance, not a required step in the loop (unlike the goal-fulfillment gate, nothing in the app depends on the parent acting on this)

**Note:** unlike the goal-fulfillment prompt, this one deliberately isn't a gate on anything — a parent can dismiss or defer it indefinitely without affecting the child's experience, since it's advisory rather than part of the core loop.

---

### 15. Parent: today's recap
**Purpose:** the lightweight oversight promised by the self-marking model — parents review what the child self-marked as done for Expected items and can correct anything that wasn't actually true, after the fact rather than gatekeeping in real time.
**Key elements:**
- Header "Today's recap" + date with back/forward day navigation
- List of that day's Expected items, each showing the item name, when the child self-marked it, and a checkbox the parent can toggle off if it wasn't actually done
- "Looks good" button to close out the review

**Open design question (real edge case, not yet resolved):** if a parent unchecks an item here, what happens to anything downstream that already depended on it being done? Specifically — if all Expected items were self-marked, Gigs unlocked, and a Gig was already completed and approved before the parent catches the false Expected claim in recap, does that already-approved Gig progress get reversed? Does the streak get broken retroactively? This needs a real answer before build — my instinct is the streak should break (since it existed to reflect genuine reliability) but already-approved Gig progress should probably stand once approved, to avoid clawing back a reward after the fact in a way that could feel arbitrary or punitive to the child for something they may not have caused (e.g., they thought they'd made the bed well enough).

### 16. Excused day — auto-detected (kid-facing home screen state, revised)
**Purpose:** on a birthday or recognized holiday, excusable Expected items become optional and no longer gate Gigs — but "excused" means optional, not hidden or blocked. The child can still choose to do an excused item (it still counts, e.g., toward the streak), and some Expected items are never excusable regardless of the day.
**Key elements:**
- A small inline note near the Expected section (not a full banner takeover, since most of the list is unaffected): icon + "It's your birthday, some Expected is excused today"
- Expected list shows all items as normal (plain circle, tappable) — excused items additionally carry a small "Excused today" pill tag; always-required items carry no tag and behave exactly as on a normal day
- Gigs lock logic now counts only always-required items toward unlocking (e.g., "0 of 2 required done"), ignoring excused items entirely for gating purposes — but a child completing an excused item anyway still self-marks it and it still counts (e.g., toward the streak)
- **Trigger logic (decided):** two automatic triggers — the child's own birthday (from the profile birthday field captured in setup) and recognized holidays (a standard holiday list, likely locale-based). Both make *excusable* items optional for that day; always-required items are unaffected by any trigger, automatic or manual.

**New setup-flow implication (not yet reflected in screen 7's mockup):** each Expected item now needs a per-item property set during Expected & Gigs setup — excusable vs. always-required (e.g., "Make your bed" and "Put dishes away" as always-required; "Homework before screen time" and "Read for 20 minutes" as excusable). Content library defaults should probably suggest sensible values per item (the truly baseline hygiene/tidiness items as always-required, more schedule-dependent ones as excusable), with the parent able to override either way. Screen 7's mockup should be updated to include this toggle before it's considered final.

### 17. Parent: manual excuse toggle
**Purpose:** covers everything the automatic triggers don't — sick days, travel, family events — so the Gigs lock doesn't feel punitive on a legitimately busy day that isn't a holiday or birthday. Applies the same excusable/always-required split as the automatic triggers — it only makes excusable items optional, never the always-required ones.
**Key elements:**
- Short explanation distinguishing this from the automatic cases
- "Excuse today's Expected" toggle
- Optional reason dropdown (Sick day / Travel / Family event / Other) — not shown to the child, just for the parent's own record-keeping
- Save button

**Open question:** should this support excusing a range of days at once (e.g., a week-long trip) rather than one day at a time? As designed, it's single-day only — worth deciding whether multi-day is a v1 need or a later addition.

---

## Known follow-ups / inconsistencies to resolve
- ~~Content library for age/grade-appropriate Expected items and Gigs needs to be scoped as its own workstream~~ **Started:** an initial 3rd/4th grade set now exists in `content-library-grade-3-4.md` (11 Expected items, 19 Gigs). Still needs expansion to other grades, and real-world testing/revision with families before treating it as final.
- **Schedule is currently informational only, not tied to Expected/Gigs.** A recurring schedule event (a weekly piano lesson, a recurring homework block for a specific class) isn't linked to the Expected item it implies — right now the two live as separate lists a parent maintains independently. Worth designing how an Expected item could reference a ScheduleEvent (so "piano practice" only shows up on the days it's actually scheduled, rather than every day) once the core loop has been used enough to know whether that precision is actually needed day to day.
- **Setup forms need a UX pass.** The manual add-event and add-custom-item/gig forms (screens 6-7) are functional but rough — worth revisiting once the core loop has had more real use, to see which fields actually cause friction.

---

## Suggested build sequencing (for handoff to Claude Code)

The full core loop is now specced end to end with no gaps in the primary path: 3-step parent setup → child home screen with self-marking and gated Gigs → parent approval queue → celebratory moments (badge unlock, decline/retry, grit, goal achieved) → goal queue and Future Fund. A reasonable phased build order:

1. ~~**Data model + navigation shell**~~ **Done.**
2. ~~**Parent setup flow** (screens 4–7)~~ **Done**, plus a stubbed Google Calendar import (mock data, no real OAuth yet).
3. ~~**Child home screen + self-marking + Gigs lock** (screen 2)~~ **Done** — Gigs lock later revised to a soft parent-confirmation instead of a hard lock (see Gating, above).
4. ~~**Parent approval queue + decline/retry loop** (screens 8–10)~~ **Superseded, not built** — see the Approval model revision above; gigs are approved instantly by the present parent instead.
5. ~~**Goal system** (screen 3) + **Goal achieved celebration and fulfillment** (screens 12–13)~~ **Done**, plus goal editing/deletion for non-active goals with zero earned progress, and switching which queued goal is active.
6. ~~**Badge shelf** (screen 11) + **badge unlock moments** (screen 1)~~ **Done** — a fixed catalog (streak/gig-milestone/big-job/goal-achieved), not exhaustive; see `src/data/badgeCatalog.ts`. Character/grit badges excluded (need the decline/retry flow, which isn't built).
7. ~~**Future Fund milestone prompt** (screen 14)~~ **Done**, styled distinctly (violet) from goal cards — dollar balance, progress toward the milestone, the educational Roth IRA/brokerage cards, and a way for the parent to log an actual contribution once money moves to a real account.
8. **Still fast-follow:** the excusable-vs-always-required split (screens 16–17), today's recap (screen 15), multi-child management, linking Expected items to specific ScheduleEvents (see Known follow-ups).

Content library authoring (age/grade-appropriate Expected items and Gigs, with suggested effort tiers) can happen in parallel with steps 1–3 — it doesn't block scaffolding, only blocks setup being genuinely usable with real suggestions rather than placeholders.

---

### 18. Parent dashboard (parent-facing, home base)
**Purpose:** the parent's own top-level screen and the actual home of the "Check in with [Child]" entry point that the touchpoint navigation model depends on. This was a real gap — every other parent screen (approvals, setup, recap, excuse toggle) existed, but nothing tied them together as a starting point.
**Key elements:**
- Child card per child: avatar, name, grade, a pending-approvals count badge, active goal progress bar, and a primary "Check in with [Child]" button
- "+ Add another child" action below the card(s) — the entry point into the deferred multi-child management flow, surfaced here even though the full flow behind it isn't built yet
- Settings icon (top right) — where the excuse toggle, Future Fund percentage, and other account-level settings likely live (not yet mapped to a specific settings screen)

**Clarification this surfaces:** approvals don't require the child to be present — a parent can review and approve/decline a Gig on their own time (e.g., at work), independent of a check-in session. Only the *result* (a badge unlock, the gentle decline feedback, a grit celebration) needs the child there, and that naturally surfaces at the next check-in. So tapping the pending-approvals count should open the approval queue directly, not trigger a child-facing session — "Check in with [Child]" and "review approvals" are two separate entry points from this screen, not one combined flow.
