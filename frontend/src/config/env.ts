import { z } from 'zod';

const envSchema = z.object({
  // API
  VITE_API_URL: z.string().url('VITE_API_URL must be a valid URL'),

  // Support
  VITE_SUPPORT_EMAIL: z.string().email().default('support@shiftly.app'),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  VITE_ENABLE_SENTRY: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // Build info (auto-injected by Vite)
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);

    // In development, show alert; in production, fail silently but log
    if (import.meta.env.DEV) {
      throw new Error(
        `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`
      );
    }
  }

  return result.data as Env;
}

export const env = validateEnv();
