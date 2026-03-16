import express, { type Application } from "express";
import userRouter from "../../src/routes/user.routes.js";
import taskRouter from "../../src/routes/task.routes.js";
import listRouter from "../../src/routes/list.routes.js";
import settingsRouter from "../../src/routes/settings.routes.js";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import { AppError } from "../../src/utils/errors.js";

/**
 * Create Express app for testing (without starting the server)
 */
export function createTestApp(): Application {
  const app: Application = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/api", userRouter);
  app.use("/api", taskRouter);
  app.use("/api", listRouter);
  app.use("/api", settingsRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  });

  // Global Error Handler
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ): void => {
      // Handle Zod validation errors
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
        return;
      }

      // Handle custom AppError instances
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          message: err.message,
        });
        return;
      }

      // Handle generic errors as 500
      const error = err as Error;
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    },
  );

  return app;
}
