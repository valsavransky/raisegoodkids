// Google OAuth for Calendar access, via expo-auth-session's generic
// discovery-based flow against Google's own OAuth endpoints (PKCE, no
// client secret — the console walkthrough creates iOS/Android "installed
// app" client IDs, which are public clients). Deliberately not using
// expo-auth-session's Google-specific provider wrapper, which has changed
// shape across SDK versions more than the generic AuthSession primitives
// have.
//
// Requires a custom dev client — Expo Go can't register a redirect URI
// scoped to this app's own bundle identifier (see eas.json).
//
// NOT YET VERIFIED end-to-end: written without live Google credentials or
// a dev-client build to test against (this session had no network access
// to Expo's docs to double-check the SDK 57 API surface against, and no
// way to run a real device). Worth watching closely on the first real
// sign-in attempt.
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Narrowest scope that covers titles/times only — see the privacy note on
// screen 5 of docs/screens-and-flows.md. Deliberately not calendar.readonly,
// which also exposes attendees, descriptions, and locations.
const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const REFRESH_TOKEN_KEY = 'merit.google.refreshToken';
const ACCESS_TOKEN_KEY = 'merit.google.accessToken';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'merit.google.accessTokenExpiresAt';

interface GoogleCalendarExtra {
  iosClientId?: string;
  androidClientId?: string;
}

function getClientId(): string | null {
  const extra = (Constants.expoConfig?.extra?.googleCalendar ?? {}) as GoogleCalendarExtra;
  const clientId = Platform.OS === 'ios' ? extra.iosClientId : extra.androidClientId;
  return clientId && clientId.trim().length > 0 ? clientId : null;
}

/** False until app.json's extra.googleCalendar has a real client ID for
 * this platform — lets callers fall back to the mock calendar data instead
 * of wiring up a "Connect" button that can only fail. */
export function isGoogleCalendarConfigured(): boolean {
  return getClientId() !== null;
}

/** Hook form, since building the AuthRequest and driving the sign-in
 * prompt (promptAsync) both need to live inside a component. Exchange the
 * resulting code with exchangeCodeForTokens once response.type === 'success'. */
export function useGoogleAuthRequest() {
  const clientId = getClientId();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'merit' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? 'not-configured',
      scopes: [SCOPE],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    DISCOVERY
  );

  return { request, response, promptAsync, clientId, redirectUri };
}

async function storeTokens(tokenResponse: AuthSession.TokenResponse): Promise<void> {
  const writes: Promise<void>[] = [];
  if (tokenResponse.accessToken) {
    writes.push(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokenResponse.accessToken));
  }
  if (tokenResponse.refreshToken) {
    writes.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokenResponse.refreshToken));
  }
  if (tokenResponse.expiresIn) {
    const expiresAt = Date.now() + tokenResponse.expiresIn * 1000;
    writes.push(SecureStore.setItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt)));
  }
  await Promise.all(writes);
}

/** Call once useGoogleAuthRequest's response.type === 'success'. */
export async function exchangeCodeForTokens(
  code: string,
  request: AuthSession.AuthRequest,
  clientId: string,
  redirectUri: string
): Promise<void> {
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    DISCOVERY
  );
  await storeTokens(tokenResponse);
}

export async function isSignedIn(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  return refreshToken !== null;
}

/** Returns a valid access token, refreshing first if the cached one is
 * expired or about to be (Google access tokens are short-lived, ~1 hour).
 * Returns null if there's no stored session to use or refresh from. */
export async function getValidAccessToken(): Promise<string | null> {
  const clientId = getClientId();
  if (!clientId) return null;

  const [accessToken, expiresAtRaw, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (accessToken && expiresAt > Date.now() + 60_000) return accessToken;
  if (!refreshToken) return null;

  const refreshed = await AuthSession.refreshAsync({ clientId, refreshToken }, DISCOVERY);
  // Google doesn't always return a new refresh token on refresh — keep the
  // existing one in that case rather than losing the session.
  await storeTokens({ ...refreshed, refreshToken: refreshed.refreshToken ?? refreshToken } as AuthSession.TokenResponse);
  return refreshed.accessToken;
}

export async function signOut(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(ACCESS_TOKEN_EXPIRES_AT_KEY),
  ]);
}
