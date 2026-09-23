// "Sign in with Google" for account identity — separate from googleAuth.ts,
// which is scoped to Calendar access. This flow only needs an ID token
// once, at the moment of sign-in, to hand to the server (POST /auth/google,
// which verifies it and issues our own JWT) — there's no ongoing Google
// session to maintain afterward, the same as the typed email/password
// login: our own token is what persists from then on.
//
// Reuses the exact same Google Cloud OAuth client IDs as googleAuth.ts
// (app.json's extra.googleCalendar) — one Google Cloud client, two
// purposes, no separate setup needed. expo-auth-session's Google provider
// unconditionally merges in openid/profile/email scopes on top of whatever
// is requested (see googleAuth.ts's comment on this), so requesting zero
// extra scopes here still yields the ID token this needs, without ever
// prompting for calendar access.
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

interface GoogleClientIds {
  iosClientId?: string;
  androidClientId?: string;
}

function getClientIds(): GoogleClientIds {
  return (Constants.expoConfig?.extra?.googleCalendar ?? {}) as GoogleClientIds;
}

/** False until app.json's extra.googleCalendar has a real client ID for
 * this platform — lets callers hide the "Sign in with Google" button rather
 * than offering one that can only fail. */
export function isGoogleSignInConfigured(): boolean {
  const extra = getClientIds();
  const clientId = Platform.OS === 'ios' ? extra.iosClientId : extra.androidClientId;
  return !!clientId && clientId.trim().length > 0;
}

/** Hook form, since building the AuthRequest and driving the sign-in prompt
 * (promptAsync) both need to live inside a component — same shape as
 * googleAuth.ts's useGoogleAuthRequest, just with no calendar scope. */
export function useGoogleSignInRequest() {
  const { iosClientId, androidClientId } = getClientIds();
  return Google.useAuthRequest({
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
    scopes: [],
  });
}

/** Pulls the ID token out of a successful auth result — the only piece this
 * flow needs; everything else about the session lives server-side once
 * AuthContext.loginWithGoogle exchanges it for our own JWT. */
export function getIdToken(
  response: Extract<AuthSession.AuthSessionResult, { type: 'success' | 'error' }>
): string | null {
  return response.authentication?.idToken ?? null;
}
