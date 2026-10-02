/**
 * In-memory access-token store.
 *
 * The access token is deliberately NOT persisted to localStorage or
 * sessionStorage — both are readable by any JS running on the page, so a
 * single XSS bug would leak the token. Keeping it in memory means it
 * disappears on tab close/reload; we recover a session on load by calling
 * /auth/refresh, which relies on the httpOnly refresh-token cookie instead.
 */

let accessToken: string | null = null;
type Listener = (token: string | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function subscribeToAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
