import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { MainLayout, showToast } from '../components';
import { IssueList, FilterBar, SearchBar, Pagination, CreateIssueModal, BulkActionBar } from '../components/issues';
import { fetchIssues, bulkUpdateIssueStatus, type IssuesResponse } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Issue, IssueType, IssuePriority, IssueStatus } from '../types';

const ITEMS_PER_PAGE = 20;

// Parse URL search params into filter state
function parseUrlFilters(): {
  statuses: IssueStatus[];
  priorities: IssuePriority[];
  types: IssueType[];
  search: string;
  page: number;
} {
  const params = new URLSearchParams(window.location.search);

  return {
    statuses: (params.get('status')?.split(',').filter(Boolean) || []) as IssueStatus[],
    priorities: (params.get('priority')?.split(',').filter(Boolean) || []) as IssuePriority[],
    types: (params.get('type')?.split(',').filter(Boolean) || []) as IssueType[],
    search: params.get('search') || '',
    page: parseInt(params.get('page') || '1', 10),
  };
}

// Update URL with current filters
function updateUrlFilters(filters: {
  statuses: IssueStatus[];
  priorities: IssuePriority[];
  types: IssueType[];
  search: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (filters.statuses.length > 0) params.set('status', filters.statuses.join(','));
  if (filters.priorities.length > 0) params.set('priority', filters.priorities.join(','));
  if (filters.types.length > 0) params.set('type', filters.types.join(','));
  if (filters.search) params.set('search', filters.search);
  if (filters.page > 1) params.set('page', filters.page.toString());

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
}

export function IssuesPage() {
  // Initialize state from URL
  const initialFilters = parseUrlFilters();
  const { hasRole } = useAuth();

  // Only SQA and Admin can bulk edit
  const canBulkEdit = hasRole(['sqa', 'admin']);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Bulk selection state
  const [selectedIssueKeys, setSelectedIssueKeys] = useState<Set<string>>(new Set());

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<IssueStatus[]>(initialFilters.statuses);
  const [selectedPriorities, setSelectedPriorities] = useState<IssuePriority[]>(initialFilters.priorities);
  const [selectedTypes, setSelectedTypes] = useState<IssueType[]>(initialFilters.types);
  const [searchQuery, setSearchQuery] = useState(initialFilters.search);
  const [currentPage, setCurrentPage] = useState(initialFilters.page);

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch issues
  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response: IssuesResponse = await fetchIssues({
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
        type: selectedTypes.length > 0 ? selectedTypes : undefined,
        search: searchQuery || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      setIssues(response.issues);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatuses, selectedPriorities, selectedTypes, searchQuery, currentPage]);

  // Load issues on mount and when filters change
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Update URL when filters change
  useEffect(() => {
    updateUrlFilters({
      statuses: selectedStatuses,
      priorities: selectedPriorities,
      types: selectedTypes,
      search: searchQuery,
      page: currentPage,
    });
  }, [selectedStatuses, selectedPriorities, selectedTypes, searchQuery, currentPage]);

  // Reset to page 1 when filters change (but not when page changes)
  const handleStatusChange = useCallback((statuses: IssueStatus[]) => {
    setSelectedStatuses(statuses);
    setCurrentPage(1);
  }, []);

  const handlePriorityChange = useCallback((priorities: IssuePriority[]) => {
    setSelectedPriorities(priorities);
    setCurrentPage(1);
  }, []);

  const handleTypeChange = useCallback((types: IssueType[]) => {
    setSelectedTypes(types);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedTypes([]);
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleIssueClick = useCallback((key: string) => {
    // Navigate to issue detail page
    window.history.pushState({}, '', `/issues/${key}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  const handleRefresh = useCallback(() => {
    loadIssues();
  }, [loadIssues]);

  // Bulk selection handlers
  const handleToggleSelect = useCallback((key: string) => {
    setSelectedIssueKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((keys: string[]) => {
    if (keys.length === 0) {
      // Clear selection for visible issues
      setSelectedIssueKeys((prev) => {
        const next = new Set(prev);
        issues.forEach((issue) => next.delete(issue.key));
        return next;
      });
    } else {
      // Add all visible issues to selection
      setSelectedIssueKeys((prev) => {
        const next = new Set(prev);
        keys.forEach((key) => next.add(key));
        return next;
      });
    }
  }, [issues]);

  // Bulk action state
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleClearSelection = useCallback(() => {
    setSelectedIssueKeys(new Set());
  }, []);

  const handleBulkStatusUpdate = useCallback(async (status: IssueStatus) => {
    if (selectedIssueKeys.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const result = await bulkUpdateIssueStatus(Array.from(selectedIssueKeys), status);

      if (result.failed.length > 0) {
        showToast({
          type: 'warning',
          title: 'Partial update',
          message: `${result.updated} updated, ${result.failed.length} failed`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Bulk update complete',
          message: `${result.updated} issue(s) updated to "${status}"`,
        });
      }

      setSelectedIssueKeys(new Set());
      loadIssues();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Bulk update failed',
        message: err instanceof Error ? err.message : 'Failed to update issues',
      });
    } finally {
      setIsBulkUpdating(false);
    }
  }, [selectedIssueKeys, loadIssues]);

  // Create Issue Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleIssueCreated = useCallback((issueKey: string) => {
    setIsCreateModalOpen(false);
    showToast({
      type: 'success',
      title: `Issue ${issueKey} created!`,
      message: 'Your issue has been submitted successfully.',
      action: {
        label: 'View Issue',
        onClick: () => handleIssueClick(issueKey),
      },
    });
    // Refresh the list and navigate to the new issue
    loadIssues();
    setTimeout(() => handleIssueClick(issueKey), 1500);
  }, [handleIssueClick, loadIssues]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Issues</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {totalItems} issue{totalItems !== 1 ? 's' : ''} total
              {lastUpdated && (
                <span className="ml-2">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Create issue button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-relay-gradient rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Issue
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by summary or description..."
          />

          {/* Filter bar */}
          <FilterBar
            selectedStatuses={selectedStatuses}
            selectedPriorities={selectedPriorities}
            selectedTypes={selectedTypes}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onTypeChange={handleTypeChange}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Issue list */}
        <IssueList
          issues={issues}
          isLoading={isLoading}
          onIssueClick={handleIssueClick}
          selectable={canBulkEdit}
          selectedKeys={selectedIssueKeys}
          onToggle={handleToggleSelect}
          onSelectAll={handleSelectAll}
          hasFilters={selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedTypes.length > 0 || !!searchQuery}
          onClearFilters={handleClearAll}
          onCreateIssue={() => setIsCreateModalOpen(true)}
        />

        {/* Pagination */}
        {!isLoading && !error && issues.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleIssueCreated}
      />

      {/* Bulk Action Bar */}
      {canBulkEdit && (
        <BulkActionBar
          selectedCount={selectedIssueKeys.size}
          onClearSelection={handleClearSelection}
          onApplyStatus={handleBulkStatusUpdate}
          isLoading={isBulkUpdating}
        />
      )}
    </MainLayout>
  );
}
