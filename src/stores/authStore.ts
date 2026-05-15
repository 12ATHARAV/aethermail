import { create } from 'zustand';
import type { User, EmailAccount } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  accounts: EmailAccount[];

  setUser: (user: User | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => void;
  getAccountToken: (accountId: string) => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  accounts: [],

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, accounts: [] }),
  setLoading: (isLoading) => set({ isLoading }),

  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account],
  })),

  removeAccount: (accountId) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== accountId),
  })),

  getAccountToken: (accountId) => {
    const account = get().accounts.find((a) => a.id === accountId);
    return account?.accessToken || null;
  },
}));

export default useAuthStore;