import { useState } from 'react';

interface MobileNavProps {
  onNavigate: (tab: 'inbox' | 'search' | 'compose' | 'settings') => void;
  activeTab: 'inbox' | 'search' | 'compose' | 'settings';
  unreadCount: number;
}

export function MobileNav({ onNavigate, activeTab, unreadCount }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30 safe-area-inset-bottom">
      <button
        onClick={() => onNavigate('inbox')}
        className={`flex flex-col items-center gap-1 ${
          activeTab === 'inbox'
            ? 'text-primary-500'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <div className="relative">
          <span className="text-xl">📥</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs">Inbox</span>
      </button>

      <button
        onClick={() => onNavigate('search')}
        className={`flex flex-col items-center gap-1 ${
          activeTab === 'search'
            ? 'text-primary-500'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <span className="text-xl">🔍</span>
        <span className="text-xs">Search</span>
      </button>

      <button
        onClick={() => onNavigate('compose')}
        className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400"
      >
        <span className="text-2xl">✏️</span>
        <span className="text-xs">Compose</span>
      </button>

      <button
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center gap-1 ${
          activeTab === 'settings'
            ? 'text-primary-500'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        <span className="text-xl">⚙️</span>
        <span className="text-xs">Settings</span>
      </button>
    </nav>
  );
}

export default MobileNav;