import * as z from 'zod';

const bubblophyPublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function getBubblophyPublicEnvSource() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/**
 * Returns the public Bubblophy environment needed in browser and server code.
 *
 * Use this only for values intentionally exposed through `NEXT_PUBLIC_*`.
 * Agent credentials and service-role secrets must never be added here.
 */
export function getPublicBubblophyEnv() {
  return bubblophyPublicEnvSchema.parse(getBubblophyPublicEnvSource());
}
