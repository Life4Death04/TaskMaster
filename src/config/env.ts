import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Construct DATABASE_URL from RDS environment variables (AWS Elastic Beanstalk)
 * or use directly provided DATABASE_URL (local development)
 */
const constructDatabaseUrl = (): string => {
  // If DATABASE_URL is set directly, use it (for local dev)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Otherwise, construct from RDS environment variables (for AWS EB)
  const { RDS_HOSTNAME, RDS_PORT, RDS_DB_NAME, RDS_USERNAME, RDS_PASSWORD } =
    process.env;

  if (
    RDS_HOSTNAME &&
    RDS_PORT &&
    RDS_DB_NAME &&
    RDS_USERNAME &&
    RDS_PASSWORD
  ) {
    return `postgresql://${RDS_USERNAME}:${RDS_PASSWORD}@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DB_NAME}`;
  }

  throw new Error(
    "No database configuration found. Provide DATABASE_URL or RDS_* variables."
  );
};

/**
 * Environment variable schema using Zod
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default("3000").transform(Number),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database - will be constructed if not provided
  DATABASE_URL: z.string().min(1).default(constructDatabaseUrl()),

  // JWT Secret
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

/**
 * Validate and parse environment variables
 * Throws an error if validation fails
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export validated environment variables
export const env = parseEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;
