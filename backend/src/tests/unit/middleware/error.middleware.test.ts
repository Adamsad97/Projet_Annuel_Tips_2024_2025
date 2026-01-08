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

  // Note: Logging tests are skipped because the middleware checks for isTest
  // and skips logging entirely in test mode, making these tests not meaningful
});
