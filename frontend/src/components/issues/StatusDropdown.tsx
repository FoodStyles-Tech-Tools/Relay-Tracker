import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { IssueStatus } from '../../types';

interface StatusDropdownProps {
  value: IssueStatus | null;
  onChange: (status: IssueStatus) => void;
}

const STATUS_OPTIONS: IssueStatus[] = ['Open', 'In Progress', 'In Review', 'Done', 'Cancelled'];

const statusColors: Record<IssueStatus, { bg: string; text: string }> = {
  'Open': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'In Progress': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  'In Review': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  'Done': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  'Cancelled': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400' },
};

export function StatusDropdown({ value, onChange }: StatusDropdownProps) {
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

  const handleSelect = (status: IssueStatus) => {
    onChange(status);
    setIsOpen(false);
  };

  const currentColors = value ? statusColors[value] : { bg: 'bg-gray-100', text: 'text-gray-500' };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${currentColors.bg} ${currentColors.text} hover:opacity-80`}
      >
        {value || 'Unknown'}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {STATUS_OPTIONS.map((status) => {
            const colors = statusColors[status];
            const isSelected = status === value;

            return (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                  {status}
                </span>
                {isSelected && <Check className="w-4 h-4 text-relay-orange" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
