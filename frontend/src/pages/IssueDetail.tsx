import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Bug,
  ListTodo,
  BookOpen,
  Clock,
  User,
  Calendar,
  Link2,
  MoreHorizontal,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MainLayout, showToast } from '../components';
import { fetchIssue, updateIssue, addComment } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Issue, IssueType, IssuePriority, IssueStatus } from '../types';

// Components
import { CommentList } from '../components/issues/CommentList';
import { CommentForm } from '../components/issues/CommentForm';
import { ActivityTimeline } from '../components/issues/ActivityTimeline';
import { StatusDropdown } from '../components/issues/StatusDropdown';
import { PriorityDropdown } from '../components/issues/PriorityDropdown';

interface IssueDetailPageProps {
  issueKey: string;
  onBack: () => void;
}

// Type icons and colors
const typeConfig: Record<IssueType, { icon: typeof Bug; color: string; bgColor: string }> = {
  'Bug': { icon: Bug, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  'Task': { icon: ListTodo, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'Story': { icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
};

// Status colors
const statusColors: Record<string, string> = {
  'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'To Do': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'In Review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Priority colors
const priorityColors: Record<IssuePriority, string> = {
  'Highest': 'text-red-600 dark:text-red-400',
  'High': 'text-orange-500 dark:text-orange-400',
  'Medium': 'text-yellow-500 dark:text-yellow-400',
  'Low': 'text-gray-500 dark:text-gray-400',
  'Lowest': 'text-slate-400 dark:text-slate-500',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
      </div>
    </div>
  );
}

export function IssueDetailPage({ issueKey, onBack }: IssueDetailPageProps) {
  const { user, hasRole } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');

  const canEdit = hasRole(['admin', 'sqa']);
  const isReporter = issue?.reporter?.email?.toLowerCase() === user?.email?.toLowerCase();

  // Load issue
  const loadIssue = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchIssue(issueKey);
      setIssue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issue');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [issueKey]);

  useEffect(() => {
    loadIssue();
  }, [loadIssue]);

  // Auto-refresh every 30 seconds when tab is active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        interval = setInterval(() => loadIssue(true), 30000);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Start polling if visible
    if (document.visibilityState === 'visible') {
      interval = setInterval(() => loadIssue(true), 30000);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadIssue]);

  // Handle status change with optimistic UI
  const handleStatusChange = async (newStatus: IssueStatus) => {
    if (!issue) return;

    const previousStatus = issue.status;

    // Optimistic update - update UI immediately
    setIssue({ ...issue, status: newStatus });

    try {
      await updateIssue(issueKey, { status: newStatus });
    } catch (err) {
      // Rollback on failure
      setIssue({ ...issue, status: previousStatus });
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err instanceof Error ? err.message : 'Failed to update status',
      });
    }
  };

  // Handle priority change with optimistic UI
  const handlePriorityChange = async (newPriority: IssuePriority) => {
    if (!issue) return;

    const previousPriority = issue.priority;

    // Optimistic update - update UI immediately
    setIssue({ ...issue, priority: newPriority });

    try {
      await updateIssue(issueKey, { priority: newPriority });
    } catch (err) {
      // Rollback on failure
      setIssue({ ...issue, priority: previousPriority });
      showToast({
        type: 'error',
        title: 'Update failed',
        message: err instanceof Error ? err.message : 'Failed to update priority',
      });
    }
  };

  // Handle add comment
  const handleAddComment = async (body: string) => {
    await addComment(issueKey, body);
    await loadIssue(true);
  };

  // Get Jira URL
  const jiraUrl = `${import.meta.env.VITE_JIRA_URL || 'https://jira.atlassian.net'}/browse/${issueKey}`;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <LoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  if (error || !issue) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Issue not found'}</p>
            <button
              onClick={onBack}
              className="text-relay-orange hover:underline"
            >
              Go back to issues
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const TypeIcon = issue.type ? typeConfig[issue.type]?.icon : Bug;
  const typeColor = issue.type ? typeConfig[issue.type]?.color : 'text-gray-500';
  const typeBgColor = issue.type ? typeConfig[issue.type]?.bgColor : 'bg-gray-100';

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${typeBgColor}`}>
                <TypeIcon className={`w-5 h-5 ${typeColor}`} />
              </div>
              <span className="font-mono text-lg font-semibold text-relay-orange">
                {issue.key}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadIssue(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <a
              href={jiraUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in Jira
            </a>

            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {issue.summary}
              </h1>

              {/* Description */}
              {issue.description && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      // Style bold text
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-gray-100">
                          {children}
                        </strong>
                      ),
                      // Style headings
                      h1: ({ children }) => (
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">
                          {children}
                        </h3>
                      ),
                      // Style horizontal rules
                      hr: () => (
                        <hr className="my-4 border-gray-200 dark:border-gray-700" />
                      ),
                      // Style links
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-relay-orange hover:underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {issue.description}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Attachments */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Attachments ({issue.attachments.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {issue.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange transition-colors"
                    >
                      <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs: Comments / Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Tab headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'comments'
                      ? 'text-relay-orange border-b-2 border-relay-orange'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Comments ({issue.comments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'text-relay-orange border-b-2 border-relay-orange'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Activity ({issue.history?.length || 0})
                </button>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === 'comments' ? (
                  <div className="space-y-6">
                    <CommentForm onSubmit={handleAddComment} />
                    <CommentList comments={issue.comments || []} />
                  </div>
                ) : (
                  <ActivityTimeline history={issue.history || []} />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Details
              </h2>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  {canEdit ? (
                    <StatusDropdown
                      value={issue.status}
                      onChange={handleStatusChange}
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      issue.status ? statusColors[issue.status] : ''
                    }`}>
                      {issue.status || 'Unknown'}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Priority</span>
                  {canEdit ? (
                    <PriorityDropdown
                      value={issue.priority}
                      onChange={handlePriorityChange}
                    />
                  ) : (
                    <span className={`text-sm font-medium ${
                      issue.priority ? priorityColors[issue.priority] : ''
                    }`}>
                      {issue.priority || 'Unknown'}
                    </span>
                  )}
                </div>

                {/* Type */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <div className="flex items-center gap-2">
                    <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {issue.type || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Reporter */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reporter</span>
                  <div className="flex items-center gap-2">
                    {issue.reporter?.avatar ? (
                      <img
                        src={issue.reporter.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {issue.reporter?.name || issue.reporter?.email || 'Unknown'}
                    </span>
                    {isReporter && (
                      <span className="text-xs text-relay-orange">(you)</span>
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Assignee</span>
                  <div className="flex items-center gap-2">
                    {issue.assignee ? (
                      <>
                        {issue.assignee.avatar ? (
                          <img
                            src={issue.assignee.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {issue.assignee.name || issue.assignee.email}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                Dates
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(issue.created)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatRelativeTime(issue.updated)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
