import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { User, EmailAccount } from '@/types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accounts: EmailAccount[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => void;
  getAccessToken: (accountId: string) => string | null;
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    isLoading: storeLoading,
    accounts,
    setUser,
    clearUser,
    addAccount: storeAddAccount,
    removeAccount: storeRemoveAccount,
    getAccountToken,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      const mockUser: User = {
        id: 'user-1',
        email,
        name: email.split('@')[0],
        createdAt: new Date(),
      };
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(() => {
    clearUser();
  }, [clearUser]);

  const addAccount = useCallback((account: EmailAccount) => {
    storeAddAccount(account);
  }, [storeAddAccount]);

  const removeAccount = useCallback((accountId: string) => {
    storeRemoveAccount(accountId);
  }, [storeRemoveAccount]);

  const getAccessToken = useCallback((accountId: string) => {
    return getAccountToken(accountId);
  }, [getAccountToken]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || storeLoading,
    accounts,
    login,
    logout,
    addAccount,
    removeAccount,
    getAccessToken,
  };
}

export default useAuth;