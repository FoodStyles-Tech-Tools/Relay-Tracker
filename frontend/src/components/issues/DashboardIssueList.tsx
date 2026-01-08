import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchIssues } from '../../lib/api';
import type { Issue } from '../../types';

interface DashboardIssueListProps {
  onIssueClick: (issueKey: string) => void;
}

// Status badge colors matching the main IssueList
const statusColors: Record<string, string> = {
  'SQA INVESTIGATION': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'TO DO': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'SELECTED FOR DEVELOPMENT': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'REOPENED': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'IN PROGRESS': 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white',
  'DEV COMPLETE': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'DEPLOYED TO DEV': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'QA': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'QA IN PROGRESS': 'bg-pink-600 text-white dark:bg-pink-600 dark:text-white',
  'QA PASSED': 'bg-green-600 text-white dark:bg-green-600 dark:text-white',
  'CANCELLED': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  'DONE': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  // Legacy status support
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'To Do': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'In Progress': 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white',
  'In Review': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Done': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Resolved': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Closed': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  'Cancelled': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

function getStatusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  return statusColors[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function DashboardIssueList({ onIssueClick }: DashboardIssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecentIssues() {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch recent issues, limit to 5
        const response = await fetchIssues({ limit: 5 });
        setIssues(response.issues);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load issues');
      } finally {
        setIsLoading(false);
      }
    }

    loadRecentIssues();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-relay-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 px-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent issues</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <button
          key={issue.key}
          onClick={() => onIssueClick(issue.key)}
          className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-relay-orange">{issue.key}</span>
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(issue.status)}`}>
                  {issue.status}
                </span>
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-relay-orange transition-colors">
                {issue.summary}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(issue.updated)}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
