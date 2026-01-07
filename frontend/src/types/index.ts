// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: "user" | "sqa" | "admin";
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  discord_notifications: boolean;
  theme: "light" | "dark" | "system";
  created_at: string;
}

// Issue types
export type IssueType = "Bug" | "Task" | "Story";
export type IssuePriority = "Highest" | "High" | "Medium" | "Low" | "Lowest";
export type IssueStatus =
  | "Open"
  | "To Do"
  | "In Progress"
  | "In Review"
  | "Done"
  | "Resolved"
  | "Cancelled"
  | "Closed"
  | (string & {});

export interface IssueUser {
  email: string | null;
  name: string | null;
  avatar: string | null;
}

export interface Issue {
  key: string;
  summary: string;
  description?: string;
  type: IssueType | null;
  priority: IssuePriority | null;
  status: IssueStatus | null;
  reporter: IssueUser | null;
  assignee: IssueUser | null;
  created: string;
  updated: string;
  attachments?: Attachment[];
  comments?: IssueComment[];
  history?: IssueHistoryItem[];
}

export interface IssueHistoryItem {
  id: string;
  author: IssueUser | null;
  created: string;
  items: Array<{
    field: string;
    from: string | null;
    to: string | null;
  }>;
}

export interface Attachment {
  id: string;
  filename: string;
  content: string; // Download URL
  size: number;
  mimeType: string;
  created: string;
  author: IssueUser | null;
}

export interface IssueComment {
  id: string;
  author: IssueUser | null;
  body: string;
  created: string;
  updated: string;
}

// API types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Filter types
export interface IssueFilters {
  status?: IssueStatus[];
  priority?: IssuePriority[];
  type?: IssueType[];
  reporter?: string;
  search?: string;
  page?: number;
  limit?: number;
}
