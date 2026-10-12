export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
  // Set on branch-scoped errors, e.g. 422 `unknown_branch`.
  branch?: string;
}

export interface ErrorResponse {
  errors?: ApiFieldError[];
  message?: string;
  // Provider explanation, e.g. merge `not_mergeable`.
  detail?: string;
  // Merge blockers returned with a 422.
  blockers?: string[];
}
