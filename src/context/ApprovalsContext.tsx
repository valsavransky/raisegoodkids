// What children have sent in from family devices, waiting for a parent. Loads
// from the server when the app opens or comes back to the foreground, and every
// minute while it's open. An approved item is turned into a real completion (or
// goal change) by AppDataContext.applySubmissions, once.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { useAppData } from './AppDataContext';
import { listSubmissions, decideSubmission, ApiError } from '../services/api';
import { Goal, Submission } from '../types/models';
import { track } from '../services/analytics';

const POLL_MS = 15 * 1000;

interface ApprovalsValue {
  /** Everything the server returned: waiting, and recently decided. */
  submissions: Submission[];
  pending: Submission[];
  /** Goals a child has reached that a parent hasn't marked fulfilled yet. */
  goalsToFinish: Goal[];
  /** Everything waiting on a parent: requests to review plus goals to finish. */
  waitingCount: number;
  refresh: () => Promise<void>;
  /** 'ok' when saved; 'already' if it was decided or taken back meanwhile. */
  decide: (
    id: string,
    decision: 'approved' | 'declined',
    extra?: { note?: string; price?: number; hasPhoto?: boolean; photoUri?: string }
  ) => Promise<'ok' | 'already' | 'error'>;
}

const ApprovalsContext = createContext<ApprovalsValue | undefined>(undefined);

export function ApprovalsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const { childProfile, applySubmissions, householdGoals } = useAppData();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const hasProfile = !!childProfile;
  const tokenRef = useRef(token);
  tokenRef.current = token;
  // Always the latest version: applying reads the current "already applied" list.
  const applyRef = useRef(applySubmissions);
  applyRef.current = applySubmissions;

  const refresh = useCallback(async () => {
    const t = tokenRef.current;
    if (!t) return;
    try {
      const { submissions: fresh } = await listSubmissions(t);
      setSubmissions(fresh);
      // Anything approved but not yet applied here (an app closed mid-approval, or a gig that
      // had to wait for a goal) is applied now.
      applyRef.current(fresh);
    } catch {
      // Offline or a server hiccup: keep what we have and try again later.
    }
  }, []);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!token || !hasProfile) return;
    refreshRef.current();
    const interval = setInterval(() => refreshRef.current(), POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshRef.current();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [token, hasProfile]);

  const decide: ApprovalsValue['decide'] = async (id, decision, extra) => {
    const t = tokenRef.current;
    if (!t) return 'error';
    try {
      const { photoUri, ...serverExtra } = extra ?? {};
      const { submission } = await decideSubmission(t, id, { decision, ...serverExtra });
      setSubmissions((prev) => prev.map((s) => (s.id === id ? submission : s)));
      track(decision === 'approved' ? 'submission_approved' : 'submission_declined', { kind: submission.kind });
      if (decision === 'approved') {
        applyRef.current([photoUri ? { ...submission, payload: { ...submission.payload, photoUri } } : submission]);
      }
      return 'ok';
    } catch (e) {
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
        await refreshRef.current();
        return 'already';
      }
      return 'error';
    }
  };

  const value = useMemo<ApprovalsValue>(
    () => {
      const pending = submissions.filter((s) => s.status === 'pending');
      const goalsToFinish = householdGoals.filter((g) => g.status === 'achieved');
      return { submissions, pending, goalsToFinish, waitingCount: pending.length + goalsToFinish.length, refresh, decide };
    },
    // decide only reads refs and stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submissions, refresh, householdGoals]
  );
  return <ApprovalsContext.Provider value={value}>{children}</ApprovalsContext.Provider>;
}

const NO_APPROVALS: ApprovalsValue = {
  submissions: [],
  pending: [],
  goalsToFinish: [],
  waitingCount: 0,
  refresh: async () => {},
  decide: async () => 'error',
};

export function useApprovals(): ApprovalsValue {
  // A family device has no ApprovalsProvider: nothing is ever waiting for it to decide.
  return useContext(ApprovalsContext) ?? NO_APPROVALS;
}
