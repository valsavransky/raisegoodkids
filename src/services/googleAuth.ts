// Google OAuth for Calendar access, via expo-auth-session's dedicated
// Google provider (expo-auth-session/providers/google) — NOT the generic
// discovery-based AuthSession primitives this file originally used.
//
// That first attempt failed against a real device with "Error 400:
// invalid_request" from Google, because it built the native redirect URI
// as an arbitrary custom scheme (`merit://...`). Google's Android/iOS
// "installed app" OAuth clients only accept a redirect whose scheme is the
// app's own bundle identifier / package name — which is exactly what the
// Google provider constructs internally (`${Application.applicationId}:/oauthredirect`,
// confirmed by reading expo-auth-session's own installed source rather
// than guessing again). That's also why app.json's `scheme` now lists the
// package name (com.valsavransky.merit) alongside "merit" — Android needs
// that registered as a URL scheme to hand the redirect back to this app,
// which requires a native rebuild (JS-only changes aren't enough here).
//
// One real tradeoff from using this provider: it unconditionally merges in
// `openid`, `userinfo.profile`, and `userinfo.email` scopes on top of
// whatever's requested (see expo-auth-session's ProviderUtils.applyRequiredScopes)
// — there's no way to opt out while using this provider. That's basic
// sign-in identity, not extra calendar data, so it doesn't violate the
// "only event titles and times" privacy note on screen 5, but it is a
// small scope expansion worth knowing about.
//
// Requires a custom dev client — Expo Go can't register a redirect URI
// scoped to this app's own bundle identifier (see eas.json).
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

// Narrowest scope that covers titles/times only — see the privacy note on
// screen 5 of docs/screens-and-flows.md. Deliberately not calendar.readonly,
// which also exposes attendees, descriptions, and locations.
const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

const REFRESH_TOKEN_KEY = 'merit.google.refreshToken';
const ACCESS_TOKEN_KEY = 'merit.google.accessToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'merit.google.accessTokenExpiresAt';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

interface GoogleCalendarExtra {
  iosClientId?: string;
  androidClientId?: string;
}

function getClientIds(): GoogleCalendarExtra {
  return (Constants.expoConfig?.extra?.googleCalendar ?? {}) as GoogleCalendarExtra;
}

function getClientIdForPlatform(): string | null {
  const extra = getClientIds();
  const clientId = Platform.OS === 'ios' ? extra.iosClientId : extra.androidClientId;
  return clientId && clientId.trim().length > 0 ? clientId : null;
}

/** False until app.json's extra.googleCalendar has a real client ID for
 * this platform — lets callers fall back to the mock calendar data instead
 * of wiring up a "Connect" button that can only fail. */
export function isGoogleCalendarConfigured(): boolean {
  return getClientIdForPlatform() !== null;
}

/** Hook form, since building the AuthRequest and driving the sign-in
 * prompt (promptAsync) both need to live inside a component. The Google
 * provider auto-exchanges the code for tokens once response.type ===
 * 'success' — response.authentication carries the resulting accessToken/
 * refreshToken/expiresIn directly, so callers just need to persist them
 * (see storeTokensFromAuthResult) rather than doing their own exchange. */
export function useGoogleAuthRequest() {
  const { iosClientId, androidClientId } = getClientIds();
  return Google.useAuthRequest({
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    scopes: [SCOPE],
  });
}

async function storeTokens(tokens: {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}): Promise<void> {
  const writes: Promise<void>[] = [];
  if (tokens.accessToken) {
    writes.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken));
  }
  if (tokens.refreshToken) {
    writes.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken));
  }
  if (tokens.expiresIn) {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    writes.push(SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt)));
  }
  await Promise.all(writes);
}

/** Call once useGoogleAuthRequest's response.type === 'success'. Persists
 * the tokens the provider already auto-exchanged (response.authentication)
 * into expo-secure-store. */
export async function storeTokensFromAuthResult(
  response: Extract<AuthSession.AuthSessionResult, { type: 'success' | 'error' }>
): Promise<boolean> {
  const auth = response.authentication;
  if (!auth?.accessToken) return false;
  await storeTokens({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresIn: auth.expiresIn,
  });
  return true;
}

export async function isSignedIn(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  return refreshToken !== null;
}

/** Returns a valid access token, refreshing first if the cached one is
 * expired or about to be (Google access tokens are short-lived, ~1 hour).
 * Returns null if there's no stored session to use or refresh from. */
export async function getValidAccessToken(): Promise<string | null> {
  const clientId = getClientIdForPlatform();
  if (!clientId) return null;

  const [accessToken, expiresAtRaw, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (accessToken && expiresAt > Date.now() + 60_000) return accessToken;
  if (!refreshToken) return null;

  const refreshed = await AuthSession.refreshAsync(
    { clientId, refreshToken },
    { tokenEndpoint: TOKEN_ENDPOINT }
  );
  // Google doesn't always return a new refresh token on refresh — keep the
  // existing one in that case rather than losing the session.
  await storeTokens({
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? refreshToken,
    expiresIn: refreshed.expiresIn,
  });
  return refreshed.accessToken;
}

export async function signOut(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
  ]);
}
