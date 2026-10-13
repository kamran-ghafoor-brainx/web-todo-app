import { z } from "zod";

/**
 * Environment variables, validated once at startup (EC-76).
 * A missing or invalid value throws immediately with a clear message,
 * instead of surfacing later as a confusing network error.
 */
const envSchema = z.object({
  VITE_API_URL: z
    .string({ error: "VITE_API_URL is required" })
    .trim()
    .refine((value) => value.startsWith("/") || URL.canParse(value), {
      error: 'VITE_API_URL must be a path like "/api" or an absolute URL',
    })
    // Drop trailing slashes so the http client can always join with "/path"
    .transform((value) => value.replace(/\/+$/, "")),
  VITE_USE_MOCK: z
    .enum(["true", "false"], { error: 'VITE_USE_MOCK must be "true" or "false"' })
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}\n` +
        "Copy .env.example to .env and check the values.",
    );
  }
  return result.data;
}

export const env = parseEnv(import.meta.env);
