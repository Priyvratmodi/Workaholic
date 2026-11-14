import { create } from 'zustand';
import { apiRequest } from '../api/client.js';
import { UserSummary } from '@workaholic/shared';

interface AuthState {
  user: UserSummary | null;
  isLoading: boolean;
  isInitialized: boolean;
  checkAuth: () => Promise<void>;
  setUser: (user: UserSummary | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await apiRequest<{ user: UserSummary }>('/api/auth/me');
      set({ user: res.user, isInitialized: true, isLoading: false });
    } catch {
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      set({ user: null });
    }
  },
}));
