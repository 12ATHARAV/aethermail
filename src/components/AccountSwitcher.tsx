import { useState } from 'react';
import type { EmailAccount, EmailProvider } from '@/types';

interface AccountSwitcherProps {
  accounts: EmailAccount[];
  selectedAccount: string | null;
  onSelect: (accountId: string | null) => void;
  onAddAccount: () => void;
  unreadCounts: Record<string, number>;
}

export function AccountSwitcher({
  accounts,
  selectedAccount,
  onSelect,
  onAddAccount,
  unreadCounts,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const currentAccount = accounts.find(a => a.id === selectedAccount);

  const getProviderIcon = (provider: EmailProvider) => {
    switch (provider) {
      case 'gmail': return 'G';
      case 'outlook': return 'O';
      case 'imap': return 'I';
      default: return 'E';
    }
  };

  const getProviderColor = (provider: EmailProvider) => {
    switch (provider) {
      case 'gmail': return 'bg-red-500';
      case 'outlook': return 'bg-blue-500';
      case 'imap': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {currentAccount ? (
            <>
              <div className={`w-6 h-6 rounded-full ${getProviderColor(currentAccount.provider)} flex items-center justify-center text-white text-xs font-bold`}>
                {getProviderIcon(currentAccount.provider)}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                {currentAccount.email.length > 20 ? currentAccount.email.substring(0, 20) + '...' : currentAccount.email}
              </span>
              <span className="text-gray-400">▼</span>
            </>
          ) : (
            <>
              <span className="text-gray-500">All Accounts</span>
              <span className="text-gray-400">▼</span>
            </>
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Connected Accounts</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => { onSelect(null); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !selectedAccount ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
                    A
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">All Accounts</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View all emails</p>
                  </div>
                  {!selectedAccount && <span className="text-primary-500">✓</span>}
                </button>

                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => { onSelect(account.id); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedAccount === account.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${getProviderColor(account.provider)} flex items-center justify-center text-white text-sm font-bold`}>
                      {getProviderIcon(account.provider)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{account.name || account.email.split('@')[0]}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(unreadCounts[account.id] || 0) > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                          {unreadCounts[account.id]}
                        </span>
                      )}
                      {selectedAccount === account.id && (
                        <span className="text-primary-500">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => { setIsOpen(false); setShowAddModal(true); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <span>+</span>
                  <span>Add Account</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddAccountModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}

interface AddAccountModalProps {
  onClose: () => void;
}

function AddAccountModal({ onClose }: AddAccountModalProps) {
  const [provider, setProvider] = useState<'gmail' | 'outlook' | 'imap'>('gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('993');

  const handleOAuth = (provider: 'gmail' | 'outlook') => {
    const urls = {
      gmail: '/api/auth/google',
      outlook: '/api/auth/microsoft',
    };
    window.location.href = urls[provider];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Add Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['gmail', 'outlook', 'imap'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  provider === p
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className={`w-8 h-8 mx-auto rounded-full ${getProviderColor(p)} flex items-center justify-center text-white font-bold mb-1`}>
                  {p === 'gmail' ? 'G' : p === 'outlook' ? 'O' : 'I'}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 capitalize">{p}</span>
              </button>
            ))}
          </div>

          {(provider === 'gmail' || provider === 'outlook') ? (
            <button
              onClick={() => handleOAuth(provider)}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                provider === 'gmail'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Connect with {provider === 'gmail' ? 'Google' : 'Microsoft'}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password / App Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMAP Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="imap.example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="993"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                onClick={() => {}}
                className="w-full py-3 rounded-lg font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                Connect IMAP Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getProviderColor(provider: string) {
  switch (provider) {
    case 'gmail': return 'bg-red-500';
    case 'outlook': return 'bg-blue-500';
    case 'imap': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
}

export default AccountSwitcher;