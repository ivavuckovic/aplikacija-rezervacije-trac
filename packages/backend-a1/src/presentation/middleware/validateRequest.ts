import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError }             from 'zod';
import { ApiResponse }                     from '../../domain/types';

export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`
      );

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors,
      };

      res.status(400).json(response);
      return;
    }

    req.body = result.data;
    next();
  };
}
