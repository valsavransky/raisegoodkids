# Shipping builds and updates

Two builds, two audiences. Each phone's build listens to exactly one **channel**, so what you publish to a channel only reaches phones installed from that channel's build.

| Build | Channel | Who | What goes there |
|---|---|---|---|
| Dev build (runs from Metro in the Codespace) | `development` | you | anything, instantly, while you work |
| Preview build | `preview` | beta testers | only changes that already work for you in the dev build |

(Your dev build and the tester build share an app id, so one phone holds only one at a time — use a second phone, or reinstall when you switch.)

## The release process (JavaScript-only changes — almost everything)

1. **Build and try it** in the dev build: `npx expo start --dev-client --port 443` (see `AGENTS.md`). Walk through the change on a real phone.
2. **Merge to `main`** (or ship from the branch if you're not ready to merge).
3. **Send it to testers**, from the Codespace on the branch you mean to ship:
   ```
   git pull
   npm run ship:preview -- "short description of the change"
   ```
   The command type-checks first and stops if there's an error. Testers get the update the next time they open the app (it fetches on launch, waiting up to 3 seconds), sometimes on the second open.

Updates are built from whatever code is on your machine, so always `git pull` and be on the right branch first.

### If a bad update reaches testers
Fix forward: fix it and run `npm run ship:preview` again. To pull an update right away, run `npx eas-cli update:rollback --channel preview`. Text affected testers if it mattered.

## Native changes: a new build

Needed when you add or upgrade a native package (anything installed with `npx expo install` that has native code, e.g. notifications), change `app.json` plugins/permissions, the app name, icon or splash, change `eas.json`, or upgrade Expo.

1. Bump `version` in `app.json` (e.g. `1.0.0` → `1.1.0`). Updates only reach builds with the **same** version, so old builds never receive JavaScript that expects native code they don't have.
2. `npx eas-cli build --profile preview --platform android`
3. Send testers the new install link. Testers still on the old build keep getting updates for the old version only until they reinstall.

On the free Expo plan builds queue slowly and have a monthly cap, so batch native changes together.

## iPhone: TestFlight

iPhone builds go to testers through TestFlight, not an install link. Use the `testflight` build profile (it is "store" distribution, listens to the `preview` update channel, and bumps the build number for you). The plain `preview` profile is Android-only: on iPhone it would need every tester's device registered by hand.

1. First time only: in App Store Connect, create the app with bundle ID `com.valsavransky.merit`.
2. `npx eas-cli build --platform ios --profile testflight` (it asks you to sign in with your Apple ID and approve a few prompts; say yes to enabling Push Notifications if asked).
3. `npx eas-cli submit --platform ios --profile testflight` sends it to TestFlight. Add testers in App Store Connect. People outside your team need Apple's short Beta App Review and the privacy policy link.
4. After that, JavaScript changes reach iPhone testers the same way as Android: `npm run ship:preview -- "message"` (it publishes to both platforms).

## Rule of thumb
It is native if `package.json` gained a dependency, or `app.json`/`eas.json` changed. Otherwise it's JavaScript-only.

## Versions in feedback and events
Feedback and usage events include a version like `1.0.0+a1b2c3` — the part after `+` identifies which update that tester was running.

## Server changes
Railway redeploys the server from `main` on its own. App updates and server changes are independent; if both change, ship the server first.

## Later: a staging channel
Once there are many testers (10+) or any real users, add a `staging` build profile and channel so you can check a change on a real phone before testers get it.
