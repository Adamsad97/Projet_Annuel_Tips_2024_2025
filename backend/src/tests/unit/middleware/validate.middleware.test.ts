import { validateSchema } from '../../../middlewares/validate.middleware';
import { z } from 'zod';
import { AppError } from '../../../utils/appError.util';
import { createMockRequest, createMockResponse } from '../../../types/test.types';
import type { Request, Response } from 'express';

describe('validateSchema', () => {
  const schema = z.object({ name: z.string() });
  const middleware = validateSchema(schema);

  it('erreur si validation echoue', () => {
    const req = createMockRequest({ body: { name: 123 } }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('met les donnees parsees dans body et passe', () => {
    const req = createMockRequest({ body: { name: 'bob', extra: 'x' } }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(req.body).toEqual({ name: 'bob' });
    expect(next).toHaveBeenCalledWith();
  });
});
