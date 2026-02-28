import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const resolved = theme === 'system' ? getSystemTheme() : theme;
  const root = document.documentElement;

  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',

      setTheme: (theme: Theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const current = get().theme;
        const resolved = current === 'system' ? getSystemTheme() : current;
        const next = resolved === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'shattaf-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Listen to system preference changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });

  // Apply on load
  const { theme } = useThemeStore.getState();
  applyTheme(theme);
}
