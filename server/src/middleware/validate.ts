import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/errors.js';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError || err?.name === 'ZodError' || Array.isArray(err?.issues)) {
        const issues = err.issues || err.errors || [];
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Invalid request payload',
          issues.map((e: any) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : e.path,
            message: e.message,
          }))
        );
      }
      return sendError(res, 400, 'BAD_REQUEST', 'Invalid request data');
    }
  };
}
