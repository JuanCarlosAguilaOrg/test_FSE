import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { DomainError } from '../domain/errors';

export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next: NextFunction) => {
    fn(req, res).catch(next);
  };

const send = (res: Response, status: number, code: string, message: string, details?: unknown) =>
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

export const notFound: RequestHandler = (_req, res) =>
  void send(res, 404, 'NOT_FOUND', 'Recurso no encontrado.');

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) return void send(res, err.status, err.code, err.message, err.details);
  if (err instanceof DomainError) return void send(res, 409, err.code, err.message);
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return void send(res, 400, 'VALIDATION_ERROR', 'La solicitud no es válida.', details);
  }
  const type = (err as { type?: string } | null)?.type;
  if (type === 'entity.parse.failed') return void send(res, 400, 'INVALID_JSON', 'JSON mal formado.');
  if (type === 'entity.too.large') return void send(res, 413, 'PAYLOAD_TOO_LARGE', 'Cuerpo demasiado grande.');

  if (process.env.NODE_ENV !== 'test') console.error(err); // solo al log del servidor
  send(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor.');
};
