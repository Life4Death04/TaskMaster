import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import type { ZodSchema } from "zod";

/**
 * Validate request parts (body, params, query) using Zod.
 * On success, replaces req.body/params/query with parsed values.
 * On failure, forwards ZodError to the global error handler.
 */
export function validate(schemas: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.query = schemas.query.parse(req.query) as any;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) return next(err);
      return next(err as Error);
    }
  };
}
