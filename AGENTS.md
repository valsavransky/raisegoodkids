# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Running the dev server in a Codespace (for a physical device)

To test on a physical phone from inside a GitHub Codespace, the phone needs a public URL to reach Metro through — LAN mode doesn't work (the Codespace isn't on the phone's network) and neither of Expo's usual two options work here:

- **`expo start --tunnel` is broken.** It bundles its own copy of ngrok (`@expo/ngrok-bin`), and that bundled binary is a genuinely outdated v2 build that's incompatible with ngrok's current infrastructure. Even installing a real, current ngrok binary and swapping it into that package's vendored path doesn't fully fix it — Expo's own tunnel-config-generation code is written for ngrok v2's config schema, and rejects what a real v3 binary expects. Not fixable without patching Expo's own npm package internals; don't spend time on it.
- **Codespaces' own port-forwarding doesn't work either**, even with a port set to "Public" — GitHub shows a one-time browser consent page ("You are about to access a development port...") gated behind a cookie, and a mobile app's native HTTP client has no way to click through it. It'll receive that HTML page instead of the JS bundle and fail with "Unable to load script."

**What actually works: a manually-run Cloudflare quick tunnel, with Metro on port 443.**

```bash
# one-time per container (persists across page reloads, not container rebuilds)
sudo setcap 'cap_net_bind_service=+ep' $(readlink -f $(which node))
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/
```

Then, in one terminal:
```bash
npx expo start --dev-client --port 443
```

And in a second terminal:
```bash
cloudflared tunnel --url http://localhost:443
```

Paste the printed `https://....trycloudflare.com` URL into the Expo dev-client app on the phone (manual "Enter URL" box → Connect). Port 443 specifically matters: Cloudflare's free quick tunnel only serves standard HTTPS (443), and Metro embeds whatever port it's running on into the asset/bundle URLs it hands the client — any other port (like the 8081 default) breaks asset loading, since Cloudflare's edge doesn't expose that port publicly.
