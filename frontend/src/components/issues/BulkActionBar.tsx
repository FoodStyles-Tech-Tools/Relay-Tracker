import { useState } from 'react';
import { X, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import type { IssueStatus } from '../../types';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onApplyStatus: (status: IssueStatus) => Promise<void>;
  isLoading?: boolean;
}

const AVAILABLE_STATUSES: IssueStatus[] = [
  'Open',
  'To Do',
  'In Progress',
  'In Review',
  'Done',
  'Resolved',
  'Closed',
  'Cancelled',
];

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onApplyStatus,
  isLoading = false,
}: BulkActionBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | null>(null);

  const handleApply = async () => {
    if (!selectedStatus) return;
    await onApplyStatus(selectedStatus);
    setSelectedStatus(null);
    setIsDropdownOpen(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-relay-orange text-white text-xs font-bold">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-white">
            issue{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-700" />

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <span>{selectedStatus || 'Select Status'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-48 py-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              {AVAILABLE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedStatus === status ? 'bg-relay-orange/10 text-relay-orange' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {selectedStatus === status && <CheckCircle className="w-4 h-4" />}
                  <span className={selectedStatus === status ? '' : 'ml-6'}>{status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apply button */}
        <button
          onClick={handleApply}
          disabled={!selectedStatus || isLoading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-relay-gradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Applying...
            </>
          ) : (
            'Apply'
          )}
        </button>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          disabled={isLoading}
          className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
