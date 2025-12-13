import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

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
  })
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
  res.json({
    status: "OK",
    message: "TaskMaster API is running",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/**
 * API Routes
 */
// TODO: Import and use routes here
// app.use('/api/users', userRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/lists', listRoutes);
// app.use('/api/settings', settingsRoutes);

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/**
 * Global Error Handler
 */
app.use(
  (
    err: Error,
    //Just added underscores to unused parameters. This tells TypeScript "I know they're unused, it's intentional" so it stops complaining.
    _req: express.Request,
    res: express.Response,
    //Just added underscores to unused parameters. This tells TypeScript "I know they're unused, it's intentional" so it stops complaining.
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);

    res.status(500).json({
      success: false,
      message:
        env.NODE_ENV === "development" ? err.message : "Internal server error",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
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
