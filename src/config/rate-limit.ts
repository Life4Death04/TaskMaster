import rateLimit from "express-rate-limit";
import { env } from "./env.js";

/**
 * Rate Limiting Configuration
 * 
 * Provides different rate limits based on the environment:
 * - Development: Very permissive (10000 requests per 15 minutes)
 * - Test: No limit (disabled for testing)
 * - Production: Moderate protection (500 requests per 15 minutes)
 */

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 500 : 10000, // Much higher limit for development
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => env.NODE_ENV === "test", // Disable rate limiting in test environment
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 10 : 1000, // 10 attempts in production, 1000 in dev
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});

// Moderate rate limiter for resource creation endpoints
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === "production" ? 30 : 1000, // 30 per minute in production
  message: {
    success: false,
    message: "Too many creation requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
});
