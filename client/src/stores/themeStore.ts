import { create } from 'zustand';
import { apiRequest } from '../api/client.js';

export type ThemePreference = 'light';
export type ResolvedTheme = 'light';

interface ThemeState {
  preference: 'light';
  resolved: 'light';
  reduceMotion: boolean;
  setPreference: (preference?: any) => void;
  setReduceMotion: (reduce: boolean) => void;
  syncWithUser: (userPreference?: string | null, userReduceMotion?: boolean) => void;
}

const MOTION_STORAGE_KEY = 'workaholic-reduce-motion';

function applyThemeToDOM(reduceMotion: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.setAttribute('data-theme', 'light');
  root.style.colorScheme = 'light';
  root.classList.add('light');
  root.classList.remove('dark');
  root.classList.remove('theme-transitions');

  if (reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

const initialReduceMotion: boolean = (function () {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MOTION_STORAGE_KEY) === 'true';
  } catch (e) {}
  return false;
})();

applyThemeToDOM(initialReduceMotion);

export const useThemeStore = create<ThemeState>((set, get) => {
  return {
    preference: 'light',
    resolved: 'light',
    reduceMotion: initialReduceMotion,

    setPreference: (_pref?: any) => {
      // Single light mode is enforced project-wide
      applyThemeToDOM(get().reduceMotion);
      set({ preference: 'light', resolved: 'light' });
    },

    setReduceMotion: (reduce: boolean) => {
      applyThemeToDOM(reduce);

      try {
        localStorage.setItem(MOTION_STORAGE_KEY, String(reduce));
      } catch (e) {}

      set({ reduceMotion: reduce });

      apiRequest('/api/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          reduceMotion: reduce,
        }),
      }).catch(() => {});
    },

    syncWithUser: (_userPreference?: string | null, userReduceMotion?: boolean) => {
      const nextMotion = userReduceMotion !== undefined ? userReduceMotion : get().reduceMotion;
      applyThemeToDOM(nextMotion);

      try {
        localStorage.setItem(MOTION_STORAGE_KEY, String(nextMotion));
      } catch (e) {}

      set({
        preference: 'light',
        resolved: 'light',
        reduceMotion: nextMotion,
      });
    },
  };
});
