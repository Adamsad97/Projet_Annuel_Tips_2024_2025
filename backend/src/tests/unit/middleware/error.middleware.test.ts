// Pas d'écriture en base dans un test unitaire
jest.mock('../../../modules/logs/log.service', () => ({
  logService: { recordServerError: jest.fn() },
}));

import { errorHandler } from '../../../middlewares/error.middleware';
import { logService } from '../../../modules/logs/log.service';
import { flushBackgroundTasks } from '../../../utils/background.util';
import { AppError } from '../../../utils/appError.util';
import { createMockRequest, createMockResponse } from '../../../types/test.types';
import type { Request, Response, NextFunction } from 'express';

describe('errorHandler', () => {
  it('envoie reponse json formatee avec details', async () => {
    const err = new AppError('Bad', 400, [{ path: 'x', message: 'm' }]);
    const req = createMockRequest({ method: 'GET', originalUrl: '/test' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Bad' }),
    );
    // Erreur du client : pas de log centralisé
    await flushBackgroundTasks();
    expect(logService.recordServerError).not.toHaveBeenCalled();
  });

  it('defaut 500 sur erreur generique', async () => {
    const err = new Error('oops');
    const req = createMockRequest({ method: 'POST', originalUrl: '/x' }) as Request;
    const res = createMockResponse() as unknown as Response;
    const next = jest.fn() as NextFunction;

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, message: 'oops' }),
    );
    // Le log est écrit en tâche de fond
    await flushBackgroundTasks();
    expect(logService.recordServerError).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ method: 'POST', path: '/x', statusCode: 500 }),
    );
  });
});
