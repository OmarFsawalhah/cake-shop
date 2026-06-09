// TODO (production): switch to httpOnly cookie instead of localStorage to eliminate XSS risk
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

export interface AuthUser {
  userId: string;
  role: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const res = await api<{ accessToken: string; userId: string; role: string }>(
          '/auth/login',
          { method: 'POST', body: JSON.stringify({ email, password }) },
        );
        // Dual-write: api.ts reads 'auth_token'; Zustand persists to 'cake-auth'
        localStorage.setItem('auth_token', res.accessToken);
        set({ token: res.accessToken, user: { userId: res.userId, role: res.role } });
      },

      register: async (data) => {
        const res = await api<{ accessToken: string; userId: string; role: string }>(
          '/auth/register',
          { method: 'POST', body: JSON.stringify(data) },
        );
        localStorage.setItem('auth_token', res.accessToken);
        // Store name from request input — the API doesn't return it
        set({
          token: res.accessToken,
          user: { userId: res.userId, role: res.role, name: data.name },
        });
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'cake-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      // On rehydration, sync the raw token key that api.ts reads
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('auth_token', state.token);
        }
      },
    },
  ),
);
