export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  errors?: ApiFieldError[];
  message?: string;
}
