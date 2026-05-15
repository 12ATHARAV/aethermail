import { useState } from 'react';
import { useEmail } from '@/hooks';
import { AccountSwitcher } from './AccountSwitcher';

interface SidebarProps {
  onCompose: () => void;
}

export function Sidebar({ onCompose }: SidebarProps) {
  const { folders, unreadCount, accounts, selectedAccount, setSelectedAccount } = useEmail();
  const [activeFolder, setActiveFolder] = useState('inbox');

  const getFolderIcon = (folderId: string) => {
    switch (folderId) {
      case 'inbox': return '📥';
      case 'sent': return '📤';
      case 'drafts': return '📝';
      case 'trash': return '🗑';
      case 'archive': return '📁';
      case 'spam': return '🚫';
      default: return '📁';
    }
  };

  const unreadCounts = accounts.reduce((acc, account) => {
    acc[account.id] = 0; // This would be computed from actual emails
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo / App Name */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">AetherMail</span>
        </div>
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <button
          onClick={onCompose}
          className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <span>✏️</span>
          <span>Compose</span>
        </button>
      </div>

      {/* Folders */}
      <nav className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeFolder === folder.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{getFolderIcon(folder.id)}</span>
                <span>{folder.name}</span>
              </div>
              {folder.id === 'inbox' && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Labels Section */}
        <div className="mt-6">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Labels
          </h3>
          <div className="space-y-1">
            {['Important', 'Work', 'Personal', 'Travel'].map((label) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className={`w-3 h-3 rounded-full ${
                  label === 'Important' ? 'bg-red-500' :
                  label === 'Work' ? 'bg-blue-500' :
                  label === 'Personal' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}></span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts Section */}
        <div className="mt-6 pb-4">
          <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Accounts
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedAccount(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                !selectedAccount
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold">
                A
              </div>
              <span className="truncate">All Accounts</span>
            </button>
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedAccount === account.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  account.provider === 'gmail' ? 'bg-red-500' :
                  account.provider === 'outlook' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`}>
                  {account.email.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{account.email.split('@')[0]}</span>
                {(unreadCounts[account.id] || 0) > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                    {unreadCounts[account.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Settings Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;