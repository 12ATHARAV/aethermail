import { useState, useCallback } from 'react';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  placeholder?: string;
}

export interface SearchFilters {
  unread?: boolean;
  starred?: boolean;
  hasAttachment?: boolean;
  from?: string;
  dateRange?: { start: string; end: string };
}

const FILTER_CHIPS = [
  { id: 'unread', label: 'Unread', icon: '📬' },
  { id: 'starred', label: 'Starred', icon: '⭐' },
  { id: 'hasAttachment', label: 'Has Attachment', icon: '📎' },
] as const;

export function SearchBar({ onSearch, placeholder = 'Search emails...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isFocused, setIsFocused] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch(query, filters);
  }, [query, filters, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFilter = (filterId: keyof Omit<SearchFilters, 'from' | 'dateRange'>) => {
    const newFilters = { ...filters };
    if (filterId === 'unread') newFilters.unread = !newFilters.unread;
    else if (filterId === 'starred') newFilters.starred = !newFilters.starred;
    else if (filterId === 'hasAttachment') newFilters.hasAttachment = !newFilters.hasAttachment;
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setQuery('');
    onSearch('', {});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== null);

  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg transition-colors ${
        isFocused ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-300 dark:border-gray-600'
      }`}>
        <span className="text-gray-400">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch('', filters); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        )}
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className={`p-1 rounded ${filters.dateRange ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          title="Date range"
        >
          📅
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => {
          const isActive = filters[chip.id as keyof Omit<SearchFilters, 'from' | 'dateRange'>];
          return (
            <button
              key={chip.id}
              onClick={() => toggleFilter(chip.id as keyof Omit<SearchFilters, 'from' | 'dateRange'>)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}

        {filters.dateRange && (
          <div className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary-500 text-white">
            <span>📅</span>
            <span>{new Date(filters.dateRange.start).toLocaleDateString()} - {new Date(filters.dateRange.end).toLocaleDateString()}</span>
            <button
              onClick={() => setFilters({ ...filters, dateRange: undefined })}
              className="ml-1 hover:opacity-80"
            >
              ✕
            </button>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From</label>
              <input
                type="date"
                onChange={(e) => setFilters({ ...filters, dateRange: { start: e.target.value, end: filters.dateRange?.end || e.target.value } })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To</label>
              <input
                type="date"
                onChange={(e) => setFilters({ ...filters, dateRange: { start: filters.dateRange?.start || e.target.value, end: e.target.value } })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowDatePicker(false); handleSearch(); }}
              className="px-3 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;