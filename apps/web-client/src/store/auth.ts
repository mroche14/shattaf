import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TokenResponse } from '@shattaf/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (response: TokenResponse, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  getToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (response: TokenResponse, user: User) => {
        set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      getToken: () => get().accessToken,
    }),
    {
      name: 'shattaf-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
