const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('relay_id_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Health check
export async function checkHealth(): Promise<{ status: string }> {
  return api.get<{ status: string }>('/api/health');
}

// Issues API
import type { Issue, IssueFilters } from '../types';

export interface IssuesResponse {
  issues: Issue[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchIssues(filters: IssueFilters = {}): Promise<IssuesResponse> {
  const params: Record<string, string | number | undefined> = {
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
  };

  // Convert arrays to comma-separated strings
  if (filters.status?.length) {
    params.status = filters.status.join(',');
  }
  if (filters.priority?.length) {
    params.priority = filters.priority.join(',');
  }
  if (filters.type?.length) {
    params.type = filters.type.join(',');
  }
  if (filters.reporter) {
    params.reporter = filters.reporter;
  }

  return api.get<IssuesResponse>('/api/issues', params);
}

export async function fetchIssue(key: string): Promise<Issue> {
  return api.get<Issue>(`/api/issues/${key}`);
}

export interface CreateIssueData {
  summary: string;
  details: string;
  type: 'Bug' | 'Task' | 'Story';
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  attachmentLinks?: string;
}

export async function createIssue(data: CreateIssueData): Promise<{ key: string; self: string }> {
  return api.post<{ key: string; self: string }>('/api/issues', data);
}

export async function updateIssue(key: string, data: Partial<Issue>): Promise<{ key: string }> {
  return api.put<{ key: string }>(`/api/issues/${key}`, data);
}

export async function addComment(key: string, body: string): Promise<{ id: string; body: string; created: string }> {
  return api.post<{ id: string; body: string; created: string }>(`/api/issues/${key}/comments`, { body });
}
