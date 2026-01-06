import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import type { IssueType, IssuePriority, IssueStatus } from '../../types';

interface FilterBarProps {
  selectedStatuses: IssueStatus[];
  selectedPriorities: IssuePriority[];
  selectedTypes: IssueType[];
  onStatusChange: (statuses: IssueStatus[]) => void;
  onPriorityChange: (priorities: IssuePriority[]) => void;
  onTypeChange: (types: IssueType[]) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS: IssueStatus[] = ['Open', 'In Progress', 'In Review', 'Done', 'Cancelled'];
const PRIORITY_OPTIONS: IssuePriority[] = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
const TYPE_OPTIONS: IssueType[] = ['Bug', 'Task', 'Story'];

// Status colors for pills
const statusColors: Record<IssueStatus, string> = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'In Progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'In Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Done': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Cancelled': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

// Priority colors
const priorityColors: Record<IssuePriority, string> = {
  'Highest': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Low': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'Lowest': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// Type colors
const typeColors: Record<IssueType, string> = {
  'Bug': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Task': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Story': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  colorMap?: Record<T, string>;
}

function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
  colorMap,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
          selected.length > 0
            ? 'border-relay-orange bg-relay-orange/10 text-relay-orange'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <span>{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-medium bg-relay-orange text-white rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selected.includes(option)
                    ? 'bg-relay-orange border-relay-orange'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {selected.includes(option) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  colorMap?.[option] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  selectedStatuses,
  selectedPriorities,
  selectedTypes,
  onStatusChange,
  onPriorityChange,
  onTypeChange,
  onClearAll,
}: FilterBarProps) {
  const totalFilters = selectedStatuses.length + selectedPriorities.length + selectedTypes.length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter icon and label */}
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelectDropdown
          label="Status"
          options={STATUS_OPTIONS}
          selected={selectedStatuses}
          onChange={onStatusChange}
          colorMap={statusColors}
        />

        <MultiSelectDropdown
          label="Priority"
          options={PRIORITY_OPTIONS}
          selected={selectedPriorities}
          onChange={onPriorityChange}
          colorMap={priorityColors}
        />

        <MultiSelectDropdown
          label="Type"
          options={TYPE_OPTIONS}
          selected={selectedTypes}
          onChange={onTypeChange}
          colorMap={typeColors}
        />
      </div>

      {/* Clear all button */}
      {totalFilters > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear all ({totalFilters})
        </button>
      )}
    </div>
  );
}
