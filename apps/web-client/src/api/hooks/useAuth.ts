import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useAuthStore } from '../../store/auth';
import type { LoginRequest, RegisterRequest } from '@shattaf/shared-types';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const tokenResponse = await apiClient.auth.login(data);
      // Temporarily set token to fetch user
      useAuthStore.setState({ accessToken: tokenResponse.accessToken });
      const user = await apiClient.auth.me();
      return { tokenResponse, user };
    },
    onSuccess: ({ tokenResponse, user }) => {
      setAuth(tokenResponse, user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.auth.register(data),
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await apiClient.auth.me();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);

  return () => {
    logout();
    window.location.href = '/';
  };
}
