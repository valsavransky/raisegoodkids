// Handles the household's single backend account. Deliberately invisible on
// first launch: an account is auto-created behind the scenes with a
// throwaway random email/password so AppDataContext can start backing data
// up to the server immediately, with zero signup friction. "Secure your
// account" (reachable any time from Settings, on this same phone) lets the
// parent replace those random credentials with a real email/password they
// choose — that's what's actually needed to log in from a second phone
// later, which is why it's offered rather than forced.
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { signup, login as apiLogin, loginWithGoogle as apiLoginWithGoogle, setCredentials, ApiError } from '../services/api';
import { randomToken } from '../utils/randomToken';

const TOKEN_KEY = 'merit_auth_token';
const IS_AUTO_KEY = 'merit_is_auto_account';
const EMAIL_KEY = 'merit_account_email';

interface AuthContextValue {
  /** False until the initial SecureStore read (and, on first launch, the
   * auto-signup call) has resolved one way or another. */
  isReady: boolean;
  /** Null if no backend is reachable yet (offline first launch) — callers
   * should keep working locally and just skip syncing until a future
   * launch when this becomes set. */
  token: string | null;
  isAutoAccount: boolean;
  accountEmail: string | null;
  claimAccount: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Logs into an existing (already-secured) account instead of the
   * device's own auto-created one — replaces the stored token, which
   * AppDataContext picks up and reconciles against (adopting that
   * account's server data, since this is only ever offered before a
   * local child profile exists — see LoginScreen). */
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Same shape as login(), via a Google ID token instead of typed
   * credentials — the server finds-or-creates an account by the verified
   * Google email (see server/src/auth.ts's /auth/google) and this just
   * adopts whatever token comes back, same as login(). */
  loginWithGoogle: (idToken: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAutoAccount, setIsAutoAccount] = useState(true);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          setIsAutoAccount((await SecureStore.getItemAsync(IS_AUTO_KEY)) !== 'false');
          setAccountEmail(await SecureStore.getItemAsync(EMAIL_KEY));
          return;
        }
        const autoEmail = `anon-${randomToken(16)}@merit.local`;
        const autoPassword = randomToken(32);
        const { token: newToken } = await signup(autoEmail, autoPassword);
        await SecureStore.setItemAsync(TOKEN_KEY, newToken);
        await SecureStore.setItemAsync(IS_AUTO_KEY, 'true');
        setToken(newToken);
        setIsAutoAccount(true);
      } catch (e) {
        // No backend reachable right now — the app still works fully
        // offline via local storage; syncing just stays off until a
        // future launch when signup succeeds.
        console.warn('Auto account setup failed, continuing offline', e);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const claimAccount: AuthContextValue['claimAccount'] = async (email, password) => {
    if (!token) {
      return { ok: false, error: 'Not connected right now — check your internet connection and try again.' };
    }
    try {
      await setCredentials(token, email, password);
      await SecureStore.setItemAsync(IS_AUTO_KEY, 'false');
      await SecureStore.setItemAsync(EMAIL_KEY, email);
      setIsAutoAccount(false);
      setAccountEmail(email);
      return { ok: true };
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Something went wrong — check your internet connection and try again.';
      return { ok: false, error: message };
    }
  };

  const login: AuthContextValue['login'] = async (email, password) => {
    try {
      const { token: newToken } = await apiLogin(email, password);
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(IS_AUTO_KEY, 'false');
      await SecureStore.setItemAsync(EMAIL_KEY, email);
      setToken(newToken);
      setIsAutoAccount(false);
      setAccountEmail(email);
      return { ok: true };
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Something went wrong — check your internet connection and try again.';
      return { ok: false, error: message };
    }
  };

  const loginWithGoogle: AuthContextValue['loginWithGoogle'] = async (idToken) => {
    try {
      const { token: newToken, email } = await apiLoginWithGoogle(idToken);
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(IS_AUTO_KEY, 'false');
      await SecureStore.setItemAsync(EMAIL_KEY, email);
      setToken(newToken);
      setIsAutoAccount(false);
      setAccountEmail(email);
      return { ok: true };
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : 'Something went wrong — check your internet connection and try again.';
      return { ok: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ isReady, token, isAutoAccount, accountEmail, claimAccount, login, loginWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
