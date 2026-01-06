import { Bug, ListTodo, BookOpen, Clock, User } from 'lucide-react';
import type { Issue, IssueType, IssuePriority, IssueStatus } from '../../types';

interface IssueListProps {
  issues: Issue[];
  isLoading?: boolean;
  onIssueClick?: (key: string) => void;
}

// Status badge colors
const statusColors: Record<IssueStatus, string> = {
  'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'In Review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Done': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
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

// Priority indicator bars
const priorityBars: Record<IssuePriority, number> = {
  'Highest': 5,
  'High': 4,
  'Medium': 3,
  'Low': 2,
  'Lowest': 1,
};

// Type icons and colors
const typeConfig: Record<IssueType, { icon: typeof Bug; color: string }> = {
  'Bug': { icon: Bug, color: 'text-red-500' },
  'Task': { icon: ListTodo, color: 'text-blue-500' },
  'Story': { icon: BookOpen, color: 'text-green-500' },
};

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

function PriorityIndicator({ priority }: { priority: IssuePriority | null }) {
  if (!priority) return null;

  const bars = priorityBars[priority];
  const color = priorityColors[priority];

  return (
    <div className="flex items-center gap-0.5" title={priority}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${i <= bars ? color : 'bg-gray-200 dark:bg-gray-700'}`}
          style={{ height: `${8 + i * 2}px` }}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: IssueStatus | null }) {
  if (!status) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status}
    </span>
  );
}

function TypeIcon({ type }: { type: IssueType | null }) {
  if (!type) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return <Icon className={`w-4 h-4 ${config.color}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Desktop table row
function IssueRow({ issue, onClick }: { issue: Issue; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      {/* Type + Key */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TypeIcon type={issue.type} />
          <span className="font-mono text-sm font-medium text-relay-orange">
            {issue.key}
          </span>
        </div>
      </td>

      {/* Summary */}
      <td className="px-4 py-3">
        <p className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-md group-hover:text-relay-orange transition-colors">
          {issue.summary}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={issue.status} />
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <PriorityIndicator priority={issue.priority} />
      </td>

      {/* Reporter */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {issue.reporter?.avatar ? (
            <img
              src={issue.reporter.avatar}
              alt={issue.reporter.name || ''}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
            {issue.reporter?.name || issue.reporter?.email || 'Unknown'}
          </span>
        </div>
      </td>

      {/* Created */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(issue.created)}
        </div>
      </td>
    </tr>
  );
}

// Mobile card
function IssueCard({ issue, onClick }: { issue: Issue; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-relay-orange dark:hover:border-relay-orange cursor-pointer transition-all hover:shadow-md"
    >
      {/* Header: Type + Key + Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TypeIcon type={issue.type} />
          <span className="font-mono text-sm font-medium text-relay-orange">
            {issue.key}
          </span>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-900 dark:text-gray-100 mb-3 line-clamp-2">
        {issue.summary}
      </p>

      {/* Footer: Priority + Reporter + Time */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <PriorityIndicator priority={issue.priority} />
          <div className="flex items-center gap-1">
            {issue.reporter?.avatar ? (
              <img
                src={issue.reporter.avatar}
                alt={issue.reporter.name || ''}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="truncate max-w-[100px]">
              {issue.reporter?.name?.split(' ')[0] || 'Unknown'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(issue.created)}
        </div>
      </div>
    </div>
  );
}

export function IssueList({ issues, isLoading, onIssueClick }: IssueListProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ListTodo className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          No issues found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Summary
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Reporter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <IssueRow
                key={issue.key}
                issue={issue}
                onClick={() => onIssueClick?.(issue.key)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {issues.map((issue) => (
          <IssueCard
            key={issue.key}
            issue={issue}
            onClick={() => onIssueClick?.(issue.key)}
          />
        ))}
      </div>
    </>
  );
}
