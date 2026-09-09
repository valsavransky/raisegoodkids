# raisegoodkids

This project is **"badge"** (working name) — a mobile app that teaches kids goal-setting, responsibility, and earning by splitting daily/weekly household tasks into two categories: **Expected** (unpaid, non-negotiable responsibilities) and **Gigs** (optional, paid work that builds toward a goal).

For full product vision and UX context, see:
- `docs/vision-doc-kids-goals-app.md` — product vision, target users, competitive landscape, risks
- `docs/screens-and-flows.md` — screen-by-screen specs, design system decisions, core loop

Check both docs before making UX or data-model decisions — many details (approval flow, color coding, goal queueing, Future Fund mechanics, etc.) are already decided there and should stay consistent with what's specified.

## Stack

React Native + Expo (TypeScript). One parent account per household, with one or more child profiles — no separate child login/credentials (see the device/auth model decision in `docs/screens-and-flows.md`); the child interacts through the parent's device.

See `AGENTS.md` for the Expo SDK version this project pins to and where to check version-specific API docs before writing code.
