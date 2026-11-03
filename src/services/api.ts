// Thin client for server/ — the Railway-hosted persistence API. Every call
// is short and best-effort from the caller's point of view: AuthContext and
// AppDataContext both catch failures and keep working offline via
// on-device storage, since the household's data must never depend on the
// network being up.
import { API_BASE_URL } from '../config';
import { GoalCategory, Submission, FamilyDevice } from '../types/models';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  if (!API_BASE_URL) throw new Error('API base URL not configured');
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`);
  }
  return json as T;
}

export function signup(email: string, password: string): Promise<{ token: string }> {
  return request('/auth/signup', { method: 'POST', body: { email, password } });
}

export function login(email: string, password: string): Promise<{ token: string }> {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export function setCredentials(token: string, email: string, password: string): Promise<{ ok: true }> {
  return request('/auth/credentials', { method: 'PATCH', token, body: { email, password } });
}

export function loginWithGoogle(idToken: string): Promise<{ token: string; email: string }> {
  return request('/auth/google', { method: 'POST', body: { idToken } });
}

export function sendFeedback(
  token: string,
  body: { installId: string; appVersion: string; platform: string; message: string; contact?: string }
): Promise<{ ok: true }> {
  return request('/feedback', { method: 'POST', token, body });
}

export function deleteAccount(token: string): Promise<{ ok: true }> {
  return request('/account', { method: 'DELETE', token });
}

export function fetchData(token: string): Promise<{ data: unknown | null }> {
  return request('/data', { token });
}

export function saveData(token: string, data: unknown): Promise<{ ok: true }> {
  return request('/data', { method: 'PUT', token, body: { data } });
}

/** Falls back to { category: null } on any failure (offline, server error,
 * no ANTHROPIC_API_KEY configured) rather than throwing — this only ever
 * feeds an optional "suggested for you" list, never something the goal-add
 * flow itself should be blocked by. */
export async function classifyGoalCategory(token: string, name: string): Promise<GoalCategory | null> {
  try {
    const result = await request<{ category: GoalCategory | null }>('/goals/classify-category', {
      method: 'POST',
      token,
      body: { name },
    });
    return result.category;
  } catch {
    return null;
  }
}

// ---- Family devices and approvals (see server/src/family.ts) -----------------


/** Parent: a 6-character code to type on the family device. */
export function createFamilyCode(token: string): Promise<{ code: string; expiresAt: string }> {
  return request('/family/codes', { method: 'POST', token });
}

export function listFamilyDevices(token: string): Promise<{ devices: FamilyDevice[] }> {
  return request('/family/devices', { token });
}

export function removeFamilyDevice(token: string, id: number): Promise<{ ok: true }> {
  return request(`/family/devices/${id}`, { method: 'DELETE', token });
}

/** Everything waiting for a parent, plus recent decisions. */
export function listSubmissions(token: string): Promise<{ submissions: Submission[] }> {
  return request('/family/submissions', { token });
}

export function decideSubmission(
  token: string,
  id: string,
  body: { decision: 'approved' | 'declined'; note?: string; price?: number }
): Promise<{ submission: Submission }> {
  return request(`/family/submissions/${encodeURIComponent(id)}/decide`, { method: 'POST', token, body });
}

/** Child device: connect with the code from a parent's phone. */
export function pairFamilyDevice(code: string, deviceName: string): Promise<{ token: string; deviceId: number }> {
  return request('/family/pair', { method: 'POST', body: { code, deviceName } });
}

// ---- Family device (child) calls: these use the device's own token. ----

export function fetchChildData(token: string): Promise<{ data: unknown | null; submissions: Submission[] }> {
  return request('/child/data', { token });
}

export function sendChildSubmission(
  token: string,
  sub: { id: string; childId: string; kind: Submission['kind']; itemId: string; day: string; payload?: { name?: string } }
): Promise<{ ok: true }> {
  return request('/child/submissions', { method: 'POST', token, body: sub });
}

export function takeBackChildSubmission(token: string, id: string): Promise<{ ok: true; removed: boolean }> {
  return request(`/child/submissions/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}
