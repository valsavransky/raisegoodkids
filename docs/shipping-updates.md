# Shipping builds and updates

Three places a version of the app can live. Each phone's build listens to exactly one **channel**, so what you publish to a channel only reaches the phones installed from that channel's build.

| Channel | Who is on it | What goes there |
|---|---|---|
| `development` | Your dev-client build (runs from Metro in the Codespace) | Anything, instantly, while you work. Nobody else sees it. |
| `staging` | You (and optionally one friendly tester) on a `staging` build | A change that works in the dev build and needs a real-device check |
| `preview` | The beta testers | Only changes that already passed on `staging` |

Staging and preview builds share the same app id and signing key, so Google sign-in works on both. Because they share an id, a phone can hold only one of them at a time (installing one replaces the other). Use a spare phone for staging, or reinstall when you switch.

## One-time setup: the staging build

```
npx eas-cli build --profile staging --platform android
```

Install it with the link or QR code on your own phone (or a spare). Do this once; after that, staging updates arrive over the air like preview ones. Rebuild only after a native change (see below).

## The release process (JavaScript-only changes — almost everything)

1. **Build and try it** in the dev build: `npx expo start --dev-client --port 443` (see `AGENTS.md`).
2. **Push to staging** from the Codespace, on the branch you're shipping:
   ```
   git pull
   npm run ship:staging -- "short description of the change"
   ```
   The command type-checks first and stops if there's an error. Open the staging app (twice, if needed — it fetches the update on launch) and check the change on a real phone.
3. **Merge to `main`** only when staging looks right.
4. **Promote to testers:**
   ```
   git checkout main && git pull
   npm run ship:preview -- "short description of the change"
   ```
   Testers get it the next time they open the app.

Updates are built from whatever code is on your machine, so always run them from the branch you mean to ship, after `git pull`.

### If a bad update reaches testers
Fix forward: fix the problem and publish again with `npm run ship:preview`. To pull the update immediately, run `npx eas-cli update:rollback --channel preview` (or republish the last good commit's code). Say what happened in a text to testers if it affected them.

### Skipping staging
For a one-line copy fix you can go straight to step 4. Anything that touches data, sign-in, setup, sync or the server should always go through staging first.

## Native changes: a new build

Needed when you add or upgrade a native package (anything installed with `npx expo install` that has native code, e.g. notifications), change `app.json` plugins/permissions, the app name, icon or splash, change `eas.json`, or upgrade Expo.

1. Bump `version` in `app.json` (e.g. `1.0.0` → `1.1.0`). Updates only reach builds with the **same** version, so old builds never receive JavaScript that expects native code they don't have.
2. Build staging first: `npx eas-cli build --profile staging --platform android`, and try it.
3. Then build for testers: `npx eas-cli build --profile preview --platform android`, and send the new install link.
4. After the bump, JavaScript updates are published to the new version; testers still on the old build stay on the old JavaScript until they reinstall.

On the free Expo plan builds queue slowly and have a monthly cap, so batch native changes together.

## Rule of thumb
It is native if `package.json` gained a dependency, or `app.json`/`eas.json` changed. Otherwise it's JavaScript-only.

## Versions in feedback and events
Feedback and usage events include a version like `1.0.0+a1b2c3` — the part after `+` identifies which update that tester was running.

## Server changes
Railway redeploys the server from `main` on its own. App updates and server changes are independent; if both change, ship the server first.
