import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { User, Organization, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    org_name?: string;
    terms_accepted?: boolean;
    terms_version?: string;
  }) => Promise<any>;
  logout: () => Promise<any>;
  updateProfile: (data: { full_name?: string; theme_preference?: 'light' | 'dark' | 'system' }) => Promise<any>;
  deleteAccount: () => Promise<any>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await api.auth.me();
      } catch (err: any) {
        if (err.status === 401 || err.status === 403) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], res);
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: api.auth.updateProfile,
    onSuccess: (res) => {
      queryClient.setQueryData(['auth', 'me'], (prev: any) =>
        prev ? { ...prev, user: res.user } : prev
      );
      queryClient.invalidateQueries();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: api.auth.deleteAccount,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.clear();
    },
  });

  const user = data?.user || null;
  const organization = data?.organization || null;
  const role = data?.role || null;
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role,
        isAdmin,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        updateProfile: updateProfileMutation.mutateAsync,
        deleteAccount: deleteAccountMutation.mutateAsync,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
