export interface ApiResponse<T = unknown> {
  success: boolean;
  status?: number;
  message?: string;
  data?: T;
  details?: string | ValidationDetail[] | Record<string, unknown>;
}

export interface ValidationDetail {
  path: string;
  message: string;
}

export interface ApiError {
  success: false;
  status: number;
  message: string;
  details?: string | ValidationDetail[] | Record<string, unknown>;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
