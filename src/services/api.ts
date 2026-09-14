// Thin client for server/ — the Railway-hosted persistence API. Every call
// is short and best-effort from the caller's point of view: AuthContext and
// AppDataContext both catch failures and keep working offline via
// on-device storage, since the household's data must never depend on the
// network being up.
import { API_BASE_URL } from '../config';

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

export function fetchData(token: string): Promise<{ data: unknown | null }> {
  return request('/data', { token });
}

export function saveData(token: string, data: unknown): Promise<{ ok: true }> {
  return request('/data', { method: 'PUT', token, body: { data } });
}
