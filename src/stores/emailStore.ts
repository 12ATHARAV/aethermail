import { create } from 'zustand';
import type { Email, EmailAccount, EmailFolder } from '@/types';
import { OrchestratorAgent } from '@/agents';

interface EmailState {
  emails: Email[];
  folders: EmailFolder[];
  accounts: EmailAccount[];
  selectedEmail: Email | null;
  selectedAccount: string | null;
  isLoading: boolean;
  error: string | null;
  lastSync: Date | null;

  setEmails: (emails: Email[]) => void;
  addEmail: (email: Email) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  removeEmail: (id: string) => void;
  setSelectedEmail: (email: Email | null) => void;
  setSelectedAccount: (accountId: string | null) => void;
  setAccounts: (accounts: EmailAccount[]) => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => void;
  setFolders: (folders: EmailFolder[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchEmails: () => Promise<void>;
  syncEmails: () => Promise<void>;
  markAsRead: (emailId: string) => void;
  markAsUnread: (emailId: string) => void;
  archiveEmail: (emailId: string) => void;
  deleteEmail: (emailId: string) => void;
  applyLabel: (emailId: string, label: string) => void;
  searchEmails: (query: string) => Promise<Email[]>;
}

const orchestrator = new OrchestratorAgent();

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  folders: [
    { id: 'inbox', name: 'Inbox', provider: 'gmail', unreadCount: 0, totalCount: 0 },
    { id: 'sent', name: 'Sent', provider: 'gmail', unreadCount: 0, totalCount: 0 },
    { id: 'drafts', name: 'Drafts', provider: 'gmail', unreadCount: 0, totalCount: 0 },
    { id: 'trash', name: 'Trash', provider: 'gmail', unreadCount: 0, totalCount: 0 },
  ],
  accounts: [],
  selectedEmail: null,
  selectedAccount: null,
  isLoading: false,
  error: null,
  lastSync: null,

  setEmails: (emails) => set({ emails }),
  addEmail: (email) => set((state) => ({ emails: [email, ...state.emails] })),
  updateEmail: (id, updates) => set((state) => ({
    emails: state.emails.map((e) => e.id === id ? { ...e, ...updates } : e),
  })),
  removeEmail: (id) => set((state) => ({
    emails: state.emails.filter((e) => e.id !== id),
    selectedEmail: state.selectedEmail?.id === id ? null : state.selectedEmail,
  })),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setSelectedAccount: (accountId) => set({ selectedAccount: accountId }),
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account],
  })),
  removeAccount: (accountId) => set((state) => ({
    accounts: state.accounts.filter((a) => a.id !== accountId),
  })),
  setFolders: (folders) => set({ folders }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchEmails: async () => {
    set({ isLoading: true, error: null });
    try {
      const { accounts } = get();
      if (accounts.length === 0) {
        set({ isLoading: false });
        return;
      }

      const result = await orchestrator.getInboxAgent().run({ accounts });
      if (result.success && result.data) {
        set({ emails: result.data.emails, lastSync: new Date() });
      } else {
        set({ error: result.error || 'Failed to fetch emails' });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      set({ isLoading: false });
    }
  },

  syncEmails: async () => {
    await get().fetchEmails();
  },

  markAsRead: (emailId) => {
    get().updateEmail(emailId, { isRead: true });
  },

  markAsUnread: (emailId) => {
    get().updateEmail(emailId, { isRead: false });
  },

  archiveEmail: (emailId) => {
    get().removeEmail(emailId);
  },

  deleteEmail: (emailId) => {
    get().removeEmail(emailId);
  },

  applyLabel: (emailId, label) => {
    const email = get().emails.find((e) => e.id === emailId);
    if (email) {
      const labels = email.labels.includes(label)
        ? email.labels
        : [...email.labels, label];
      get().updateEmail(emailId, { labels });
    }
  },

  searchEmails: async (query) => {
    const { emails } = get();
    const result = await orchestrator.getSearchAgent().run({ query, emails });
    return result.success ? result.data?.results || [] : [];
  },
}));

export default useEmailStore;