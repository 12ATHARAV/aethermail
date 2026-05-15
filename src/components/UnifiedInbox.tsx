import { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import type { Email, EmailFolder, EmailAccount } from '@/types';
import { useEmail, useAI } from '@/hooks';
import { Sidebar } from './Sidebar';
import { EmailView } from './EmailView';
import { ComposeModal } from './ComposeModal';
import { AccountSwitcher } from './AccountSwitcher';
import { SearchBar, SearchFilters } from './SearchBar';

interface UnifiedInboxProps {
  onEmailSelect?: (email: Email) => void;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UnifiedInbox({ onEmailSelect }: UnifiedInboxProps) {
  const {
    emails,
    folders,
    accounts,
    selectedEmail,
    isLoading,
    selectedAccount,
    setSelectedAccount,
    setSelectedEmail,
    fetchEmails,
    markRead,
  } = useEmail();

  const { prioritizeEmails, isProcessing: isPrioritizing } = useAI();

  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSidebar, setShowSidebar] = useState(true);
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true' ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches && !localStorage.getItem('darkMode'))
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const filteredEmails = useMemo(() => {
    let result = [...emails];

    // Filter by account
    if (selectedAccount) {
      result = result.filter(e => e.provider === selectedAccount);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(query) ||
        e.from.name.toLowerCase().includes(query) ||
        e.from.email.toLowerCase().includes(query) ||
        e.snippet.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (searchFilters.unread) result = result.filter(e => !e.isRead);
    if (searchFilters.starred) result = result.filter(e => e.isStarred);
    if (searchFilters.hasAttachment) result = result.filter(e => e.attachments.length > 0);

    return result;
  }, [emails, selectedAccount, searchQuery, searchFilters]);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    emails.forEach(e => {
      if (!e.isRead) {
        counts[e.provider] = (counts[e.provider] || 0) + 1;
      }
    });
    return counts;
  }, [emails]);

  const handleEmailClick = (email: Email) => {
    if (!email.isRead) markRead(email.id);
    setSelectedEmail(email);
    onEmailSelect?.(email);
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
    if (isYesterday(date)) return 'Yesterday';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getPriorityBadge = (priority?: number) => {
    if (!priority) return null;
    if (priority >= 8) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'High' };
    if (priority >= 6) return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: 'Medium' };
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500', label: 'Low' };
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar - Desktop */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} hidden md:block transition-all duration-200 overflow-hidden`}>
        <Sidebar onCompose={() => setShowCompose(true)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            ☰
          </button>
          <div className="flex-1 max-w-2xl">
            <SearchBar
              onSearch={(query, filters) => { setSearchQuery(query); setSearchFilters(filters); }}
            />
          </div>
          <AccountSwitcher
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelect={setSelectedAccount}
            onAddAccount={() => {}}
            unreadCounts={unreadCounts}
          />
          <button
            onClick={() => fetchEmails()}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ${isLoading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Offline Banner */}
        {isOffline && (
          <div className="flex items-center justify-center gap-2 py-2 bg-yellow-500 text-white text-sm">
            <span>📡</span>
            <span>Offline - Showing cached emails</span>
          </div>
        )}

        {/* Email List */}
        <div className="flex-1 flex overflow-hidden">
          <div className={`${selectedEmail ? 'hidden lg:block lg:w-1/2 xl:w-[45%]' : 'w-full'} overflow-y-auto`}>
            {isLoading || isPrioritizing ? (
              <LoadingSkeleton />
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <span className="text-4xl mb-2">📭</span>
                <p>No emails found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredEmails.map((email) => {
                  const priorityBadge = getPriorityBadge(email.priority);
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                      } ${!email.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                          {email.from.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {email.from.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-sm truncate ${!email.isRead ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                            {email.subject}
                          </span>
                          {priorityBadge && (
                            <span className={`px-1.5 py-0.5 text-xs rounded-full ${priorityBadge.bg} ${priorityBadge.text} flex-shrink-0`}>
                              {priorityBadge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {email.snippet}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {email.labels.slice(0, 2).map((label) => (
                            <span key={label} className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              {label}
                            </span>
                          ))}
                          {email.attachments.length > 0 && (
                            <span className="text-xs text-gray-400">📎 {email.attachments.length}</span>
                          )}
                        </div>
                      </div>
                      {email.isStarred && <span className="text-yellow-500 flex-shrink-0">⭐</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Email View - Desktop */}
          {selectedEmail && (
            <div className="hidden lg:block lg:w-1/2 xl:w-[55%] border-l border-gray-200 dark:border-gray-700">
              <EmailView email={selectedEmail} onClose={() => setSelectedEmail(null)} />
            </div>
          )}
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-10">
          <button className="flex flex-col items-center gap-1 text-primary-500">
            <span className="text-xl">📥</span>
            <span className="text-xs">Inbox</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500">
            <span className="text-xl">🔍</span>
            <span className="text-xs">Search</span>
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary-500"
          >
            <span className="text-xl">✏️</span>
            <span className="text-xs">Compose</span>
          </button>
        </nav>
      </div>

      {/* Mobile Email View Sheet */}
      {selectedEmail && (
        <div className="md:hidden fixed inset-0 z-20 bg-white dark:bg-gray-900">
          <EmailView email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        </div>
      )}

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
      />
    </div>
  );
}

export default UnifiedInbox;