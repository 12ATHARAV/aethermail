import { useCallback, useEffect } from 'react';
import { useEmailStore } from '@/stores/emailStore';
import type { Email, EmailAccount, EmailFolder } from '@/types';

export function useEmail() {
  const {
    emails,
    folders,
    accounts,
    selectedEmail,
    isLoading,
    error,
    selectedAccount,
    setSelectedEmail,
    setSelectedAccount,
    fetchEmails,
    syncEmails,
    markAsRead,
    markAsUnread,
    archiveEmail,
    deleteEmail,
    applyLabel,
    searchEmails,
  } = useEmailStore();

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].id);
    }
  }, [accounts, selectedAccount, setSelectedAccount]);

  const filteredEmails = selectedAccount
    ? emails.filter(e => e.provider === selectedAccount)
    : emails;

  const unreadCount = emails.filter(e => !e.isRead).length;

  return {
    emails: filteredEmails,
    folders,
    accounts,
    selectedEmail,
    isLoading,
    error,
    unreadCount,
    selectedAccount,
    setSelectedEmail,
    setSelectedAccount,
    refreshEmails: fetchEmails,
    syncAll: syncEmails,
    markRead: markAsRead,
    markUnread: markAsUnread,
    archive: archiveEmail,
    remove: deleteEmail,
    label: applyLabel,
    search: searchEmails,
  };
}

export default useEmail;