# Shipping builds and updates

Two kinds of changes, two ways to get them to phones.

## 1. JavaScript-only changes (almost everything): an over-the-air update

Screens, copy, logic, styles, most bug fixes. Testers get it the next time they open the app (the app checks on launch and waits up to 3 seconds for a new update before opening). No reinstall, no build queue.

From the Codespace, on the branch you want to ship:

```
git pull
npx eas-cli update --channel preview --message "short description of the fix"
```

- `preview` is the channel the tester builds listen to (set in `eas.json`).
- Feedback and usage events include a version like `1.0.0+a1b2c3` — the part after `+` identifies which update that tester was running.

## 2. Native changes: a new build

Needed when you add or upgrade a native package (anything installed with `npx expo install` that has native code, e.g. notifications), change `app.json` plugins/permissions, the app name, icon or splash, or upgrade Expo.

1. Bump `version` in `app.json` (e.g. `1.0.0` → `1.1.0`). Updates only reach builds with the **same** version, so old builds never receive JavaScript that expects native code they don't have.
2. `npx eas-cli build --profile preview --platform android`
3. Send testers the new install link.

## Rule of thumb
If you're unsure whether a change is native, it is native if `package.json` gained a dependency, or `app.json`/`eas.json` changed. Otherwise it's JavaScript-only.

## Server changes
Railway redeploys the server from `main` on its own. App updates and server changes are independent; if both change, ship the server first.
