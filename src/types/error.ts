export type ErrorLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
export type SortOrder = "ASC" | "DESC";

export interface ErrorLog {
  id: string;
  createdAt: string;
  level: ErrorLevel;
  category: string;
  errorCode?: string;
  message: string;
  stackTrace?: string;
  context?: Record<string, any>;
  userId?: string;
  vscodeVersion?: string;
  extensionVersion?: string;
  operatingSystem?: string;
  action?: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface GetErrorsParams {
  page?: number;
  limit?: number;
  level?: ErrorLevel;
  category?: string;
  userId?: string;
  resolved?: boolean;
  errorCode?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: "created_at" | "level" | "category" | "error_code" | "resolved";
  sortOrder?: SortOrder;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BaseFilters {
  level?: string;
  category?: string;
  userId?: string;
  resolved?: string;
  errorCode?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy: string;
  sortOrder: string;
}

export interface ErrorsResponse {
  errors: ErrorLog[];
  pagination: Pagination;
  filters: BaseFilters;
}
