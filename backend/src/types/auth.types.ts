import type { Request } from 'express';

export type JwtUserPayload = {
  id: number;
  email: string;
  tokenVersion?: number;
};

export interface RequestWithUser extends Request {
  user?: JwtUserPayload;
}
