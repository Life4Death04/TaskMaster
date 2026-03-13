import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { auth } from "../../../src/middlewares/auth";
import { env } from "../../../src/config/env";

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as Partial<Response>;

    mockNext = vi.fn();
  });

  describe("Successful authentication", () => {
    it("should attach decoded token to req.user and call next()", () => {
      const payload = { sub: "123", email: "test@example.com" };
      const token = jwt.sign(payload, env.JWT_SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.sub).toBe("123");
      expect(mockRequest.user?.email).toBe("test@example.com");
      expect(mockNext).toHaveBeenCalledOnce();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("should handle string sub in payload", () => {
      const payload = { sub: "456" };
      const token = jwt.sign(payload, env.JWT_SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.sub).toBe("456");
      expect(mockNext).toHaveBeenCalledOnce();
    });

    it("should handle token with additional claims", () => {
      const payload = {
        sub: "789",
        email: "user@example.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
      };
      const token = jwt.sign(payload, env.JWT_SECRET);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.sub).toBe("789");
      expect(mockRequest.user?.email).toBe("user@example.com");
      expect(mockNext).toHaveBeenCalledOnce();
    });
  });

  describe("Missing authorization header", () => {
    it("should return 401 when no authorization header", () => {
      mockRequest.headers = {};

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is empty", () => {
      mockRequest.headers = { authorization: "" };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is undefined", () => {
      mockRequest.headers = { authorization: undefined };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid Bearer format", () => {
    it("should return 401 when Bearer prefix is missing", () => {
      mockRequest.headers = {
        authorization: "InvalidToken123",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when using lowercase bearer", () => {
      const token = jwt.sign({ sub: "123" }, env.JWT_SECRET);
      mockRequest.headers = {
        authorization: `bearer ${token}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when token is missing after Bearer", () => {
      mockRequest.headers = {
        authorization: "Bearer ",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when Bearer has no space", () => {
      mockRequest.headers = {
        authorization: "BearerToken123",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Invalid token", () => {
    it("should return 401 for malformed token", () => {
      mockRequest.headers = {
        authorization: "Bearer invalid.token.here",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 for token with wrong secret", () => {
      const token = jwt.sign({ sub: "123" }, "wrong-secret");
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 for expired token", () => {
      const expiredToken = jwt.sign(
        { sub: "123", exp: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
        env.JWT_SECRET,
      );

      mockRequest.headers = {
        authorization: `Bearer ${expiredToken}`,
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 for random string token", () => {
      mockRequest.headers = {
        authorization: "Bearer randomstringnotajwt",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 for empty token", () => {
      mockRequest.headers = {
        authorization: "Bearer ",
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Token with extra whitespace", () => {
    it("should handle token with multiple spaces after Bearer", () => {
      const token = jwt.sign({ sub: "123" }, env.JWT_SECRET);
      mockRequest.headers = {
        authorization: `Bearer  ${token}`, // Two spaces
      };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      // The split(" ")[1] will get empty string, causing invalid token
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: "Invalid token" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Request mutation", () => {
    it("should not mutate request when authentication fails", () => {
      mockRequest.headers = { authorization: "Bearer invalid" };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
    });

    it("should preserve other request properties", () => {
      const token = jwt.sign({ sub: "123" }, env.JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${token}` };
      mockRequest.body = { test: "data" };
      mockRequest.params = { id: "1" };

      auth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.body).toEqual({ test: "data" });
      expect(mockRequest.params).toEqual({ id: "1" });
      expect(mockRequest.user).toBeDefined();
    });
  });
});
