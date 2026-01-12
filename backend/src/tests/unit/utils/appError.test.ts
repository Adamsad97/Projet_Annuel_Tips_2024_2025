import { AppError } from '../../../utils/appError.util';

describe('AppError', () => {
  it('cree apperror avec valeurs par defaut', () => {
    const err = new AppError('Something went wrong');
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('Something went wrong');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('preserve details et status personnalise', () => {
    const details = [{ path: 'email', message: 'Invalid' }];
    const err = new AppError('Bad Request', 400, details, true);
    expect(err.statusCode).toBe(400);
    expect(err.details).toBe(details);
  });
});
