import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z
    .string()
    .default('7d')
    .transform((val) => val as `${number}${'s' | 'm' | 'h' | 'd'}`),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Optional: Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
