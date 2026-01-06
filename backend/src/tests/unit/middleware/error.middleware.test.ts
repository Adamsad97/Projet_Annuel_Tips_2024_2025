import { errorHandler } from '../../../middlewares/error.middleware';
import { AppError } from '../../../utils/appError.util';
import { createMockRequest, createMockResponse } from '../../../types/test.types';
import type { Request, Response, NextFunction } from 'express';

describe('errorHandler', () => {
  it('sends formatted json response with details', () => {
    const err = new AppError('Bad', 400, [{ path: 'x', message: 'm' }]);
    const req = createMockRequest({ method: 'GET', originalUrl: '/test' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Bad' }),
    );
  });

  it('defaults to 500 on generic error', () => {
    const err = new Error('oops');
    const req = createMockRequest({ method: 'POST', originalUrl: '/x' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, message: 'oops' }),
    );
  });

  // Tests for logging behavior when NODE_ENV !== 'test'
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('logs once in production (only the summary)', () => {
    process.env.NODE_ENV = 'production';
    const err = new AppError('Bad', 400, [{ path: 'x', message: 'm' }]);
    const req = createMockRequest({ method: 'GET', originalUrl: '/test' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    // production path logs only the summary once
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[GET] /test → 400: Bad'));
  });

  it('logs summary and stack in non-production (dev) mode', () => {
    process.env.NODE_ENV = 'development';
    const err = new AppError('Bad', 400);
    const req = createMockRequest({ method: 'POST', originalUrl: '/x' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    // dev path logs twice: summary + stack (or fallback message)
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(spy.mock.calls[0]![0]).toContain('[POST] /x → 400: Bad');
    // second call is the stack or fallback text (if present)
    if (spy.mock.calls.length > 1 && spy.mock.calls[1] && spy.mock.calls[1][0]) {
      expect(typeof spy.mock.calls[1][0]).toBe('string');
    }
  });
});
