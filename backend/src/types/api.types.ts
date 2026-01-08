export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  status: number;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
