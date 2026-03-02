import express, { type Application } from "express";
import { apiRoutes } from "./routes/index.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { ZodError } from "zod";
import type {
  HealthCheckResponse,
  ApiNotFoundResponse,
  ApiValidationErrorResponse,
  ApiErrorResponse,
} from "./types/response.types.js";

// Initialize Express app
const app: Application = express();

/**
 * Security Middleware
 */
// Helmet helps secure Express apps by setting HTTP response headers
app.use(helmet()); //???

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

/**
 * CORS Configuration
 */
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

/**
 * Body Parser Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health Check Route
 */
app.get("/health", (_req, res) => {
  const response: HealthCheckResponse = {
    status: "OK",
    message: "TaskMaster API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };
  res.json(response);
});

/**
 * API Routes
 * All routes are registered under /api prefix
 */
apiRoutes.forEach((router) => {
  app.use("/api", router);
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  const response: ApiNotFoundResponse = {
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  };
  res.status(404).json(response);
});

/**
 * Global Error Handler
 */
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    // Zod validation errors → 400 Bad Request with field issues
    if (err instanceof ZodError) {
      const response: ApiValidationErrorResponse = {
        success: false,
        message: "Validation failed",
        errors: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      };
      res.status(400).json(response);
      return;
    }

    const error = err as Error;
    console.error("Error:", error);

    const response: ApiErrorResponse = {
      success: false,
      message:
        env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
    };
    res.status(500).json(response);
  },
);

/**
 * Start Server
 */
const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 TaskMaster API Server         ║
╠════════════════════════════════════════╣
║  Environment: ${env.NODE_ENV.padEnd(24)} s║
║  Port:        ${PORT.toString().padEnd(24)} ║
║  URL:         http://localhost:${PORT.toString().padEnd(7)} ║
╚════════════════════════════════════════╝
  `);
});

export default app;
