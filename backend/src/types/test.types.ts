import type { Request, Response } from 'express';

// mock types testing
export type MockRequest<TBody = unknown, TParams = unknown, TQuery = unknown> = Partial<Request> & {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
  method?: string;
  originalUrl?: string;
  headers?: Record<string, string>;
};

export type MockResponse = Partial<Response> & {
  status: jest.Mock;
  json: jest.Mock;
  send?: jest.Mock;
};

export type MockNextFunction = jest.Mock;

// create mock response
export function createMockResponse(): MockResponse {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as MockResponse;
  return res;
}

// create mock request
export function createMockRequest<TBody = unknown>(
  overrides?: Partial<MockRequest<TBody>>,
): MockRequest<TBody> {
  return {
    method: 'GET',
    originalUrl: '/',
    headers: {},
    body: {} as TBody,
    ...overrides,
  };
}
