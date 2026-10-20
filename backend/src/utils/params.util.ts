import { AppError } from './appError.util';

export function parseIdParam(value: string | undefined, label = 'id'): number {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`invalid ${label}`, 400);
  }

  return id;
}
