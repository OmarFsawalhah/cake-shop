const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // Read token directly from localStorage to avoid circular dep with useAuth store
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 401) {
    // Dispatch event so App.tsx can clear auth state and redirect to /login
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
