import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { validate } from "../../../src/middlewares/validate";
import type { Mock } from "vitest";

describe("Validate Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  mockNext = vi.fn() as unknown as NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {};
    mockNext = vi.fn();
  });

  describe("Body validation", () => {
    const bodySchema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it("should parse valid body and call next()", () => {
      mockRequest.body = { name: "John", age: 25 };

      const middleware = validate({ body: bodySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ name: "John", age: 25 });
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith(); // No error
    });

    it("should transform and coerce values when schema allows", () => {
      const coerceSchema = z.object({
        count: z.coerce.number(),
      });

      mockRequest.body = { count: "42" };

      const middleware = validate({ body: coerceSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.count).toBe(42);
      expect(typeof mockRequest.body.count).toBe("number");
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it("should forward ZodError to next() on validation failure", () => {
      mockRequest.body = { name: "", age: -5 }; // Invalid data

      const middleware = validate({ body: bodySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
      expect((error as ZodError).issues.length).toBeGreaterThan(0);
    });

    it("should forward ZodError for missing required fields", () => {
      mockRequest.body = { name: "John" }; // Missing age

      const middleware = validate({ body: bodySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("should forward ZodError for extra fields when strict", () => {
      const strictSchema = z
        .object({
          name: z.string(),
        })
        .strict();

      mockRequest.body = { name: "John", extraField: "unexpected" };

      const middleware = validate({ body: strictSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("should allow extra fields by default (non-strict)", () => {
      const nonStrictSchema = z.object({
        name: z.string(),
      });

      mockRequest.body = { name: "John", extraField: "allowed" };

      const middleware = validate({ body: nonStrictSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.name).toBe("John");
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith(); // No error
    });
  });

  describe("Params validation", () => {
    const paramsSchema = z.object({
      id: z.string().regex(/^\d+$/),
    });

    it("should parse valid params and call next()", () => {
      mockRequest.params = { id: "123" };

      const middleware = validate({ params: paramsSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.params).toEqual({ id: "123" });
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should forward ZodError for invalid params", () => {
      mockRequest.params = { id: "abc" }; // Non-numeric

      const middleware = validate({ params: paramsSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("should forward ZodError for missing params", () => {
      mockRequest.params = {};

      const middleware = validate({ params: paramsSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe("Query validation", () => {
    const querySchema = z.object({
      page: z.string().optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    });

    it("should parse valid query and call next()", () => {
      mockRequest.query = { page: "1", limit: "10" };

      const middleware = validate({ query: querySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query).toEqual({ page: "1", limit: "10" });
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle empty query parameters", () => {
      mockRequest.query = {};

      const middleware = validate({ query: querySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.query).toEqual({});
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should forward ZodError for invalid query params", () => {
      mockRequest.query = { page: "1", limit: "abc" }; // Non-numeric limit

      const middleware = validate({ query: querySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe("Multiple validations", () => {
    const bodySchema = z.object({ name: z.string().min(1) }); // Must be non-empty
    const paramsSchema = z.object({ id: z.string().regex(/^\d+$/) });
    const querySchema = z.object({ filter: z.string().optional() });

    it("should validate all parts when all are valid", () => {
      mockRequest.body = { name: "John" };
      mockRequest.params = { id: "123" };
      mockRequest.query = { filter: "active" };

      const middleware = validate({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema,
      });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ name: "John" });
      expect(mockRequest.params).toEqual({ id: "123" });
      expect(mockRequest.query).toEqual({ filter: "active" });
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should fail validation on first invalid part (body)", () => {
      mockRequest.body = { name: "" }; // Invalid
      mockRequest.params = { id: "123" };
      mockRequest.query = { filter: "active" };

      const middleware = validate({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema,
      });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it("should fail validation on params when body is valid", () => {
      mockRequest.body = { name: "John" };
      mockRequest.params = { id: "abc" }; // Invalid
      mockRequest.query = { filter: "active" };

      const middleware = validate({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema,
      });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe("Partial validation", () => {
    const bodySchema = z.object({ name: z.string() });

    it("should only validate body when only body schema provided", () => {
      mockRequest.body = { name: "John" };
      mockRequest.params = { invalid: "data" }; // Not validated
      mockRequest.query = { invalid: "data" }; // Not validated

      const middleware = validate({ body: bodySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith(); // No error
    });

    it("should skip validation when no schemas provided", () => {
      mockRequest.body = { anything: "goes" };

      const middleware = validate({});
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe("Complex schemas", () => {
    it("should handle nested object schemas", () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      mockRequest.body = {
        user: {
          name: "John",
          email: "john@example.com",
        },
      };

      const middleware = validate({ body: nestedSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({
        user: { name: "John", email: "john@example.com" },
      });
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle array schemas", () => {
      const arraySchema = z.object({
        items: z.array(z.string()),
      });

      mockRequest.body = {
        items: ["item1", "item2", "item3"],
      };

      const middleware = validate({ body: arraySchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body.items).toEqual(["item1", "item2", "item3"]);
      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle schemas with refinements", () => {
      const refinedSchema = z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords must match",
          path: ["confirmPassword"],
        });

      // Valid case
      mockRequest.body = {
        password: "password123",
        confirmPassword: "password123",
      };

      const middleware = validate({ body: refinedSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should forward error for failed refinement", () => {
      const refinedSchema = z
        .object({
          password: z.string(),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords must match",
        });

      mockRequest.body = {
        password: "password123",
        confirmPassword: "different",
      };

      const middleware = validate({ body: refinedSchema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledOnce();
      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });
  });

  describe("Error handling", () => {
    it("should forward ZodError instances to next()", () => {
      const schema = z.object({ value: z.number() });
      mockRequest.body = { value: "not-a-number" as any };

      const middleware = validate({ body: schema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
      expect((error as ZodError).issues.length).toBeGreaterThan(0);
    });

    it("should preserve ZodError details", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });
      mockRequest.body = { email: "invalid", age: 10 } as any;

      const middleware = validate({ body: schema });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      const error = (mockNext as any).mock.calls[0][0] as ZodError;
      expect(error.issues.length).toBe(2); // Two validation errors
      expect(error.issues.some((e) => e.path.includes("email"))).toBe(true);
      expect(error.issues.some((e) => e.path.includes("age"))).toBe(true);
    });
  });
});
