/**
 * Public runtime configuration + fail-fast validation.
 *
 * `EXPO_PUBLIC_*` values are inlined by Metro at bundle time (see `env.d.ts`).
 * This module is the single source of truth for reading them, so the API client
 * and the auth layer never disagree on the backend URL or the Clerk key.
 */

/** Existing TattooGo backend on Render; used when `EXPO_PUBLIC_API_URL` is unset. */
export const API_FALLBACK_URL = 'https://api.tattoogomk.com.br';

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
const rawClerkKey = (process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').trim();

/** Backend base URL, always non-empty (falls back to the production Render host). */
export const apiBaseUrl = rawApiUrl.length > 0 ? rawApiUrl : API_FALLBACK_URL;

/** Clerk publishable key, or `null` when the build runs in inspectable dev mode. */
export const clerkPublishableKey = rawClerkKey.length > 0 ? rawClerkKey : null;

/** Whether native Clerk auth is configured for this build. */
export const isAuthConfigured = clerkPublishableKey !== null;

const API_URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const CLERK_KEY_PATTERN = /^pk_(test|live)_[A-Za-z0-9]+$/;

export interface EnvIssue {
  key: string;
  message: string;
  /** A fatal issue must stop the build/app; a non-fatal one only degrades. */
  fatal: boolean;
}

/**
 * Validates the public configuration. Returns every problem found instead of
 * throwing, so the boot sequence can report all of them at once.
 *
 * `EXPO_PUBLIC_API_URL` is optional (there is a production fallback) but, when
 * provided, must be a well-formed http(s) URL. The Clerk key is optional in
 * development — the shell is intentionally inspectable without auth — but is
 * treated as fatal in production, where a missing key would ship a broken login.
 */
export function validatePublicEnv(): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (rawApiUrl.length > 0 && !API_URL_PATTERN.test(rawApiUrl)) {
    issues.push({
      key: 'EXPO_PUBLIC_API_URL',
      message: `não é um URL http(s) válido: "${rawApiUrl}"`,
      fatal: true,
    });
  }

  if (clerkPublishableKey && !CLERK_KEY_PATTERN.test(clerkPublishableKey)) {
    issues.push({
      key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      message: 'deve começar por "pk_test_" ou "pk_live_"',
      fatal: true,
    });
  } else if (!clerkPublishableKey) {
    issues.push({
      key: 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
      message: 'ausente — a autenticação nativa fica em modo de desenvolvimento (pass-through).',
      fatal: isProduction,
    });
  }

  return issues;
}

/**
 * Logs the configuration report at boot. Fatal issues are errors, the rest are
 * warnings; the app shell is never blanked by a misconfiguration.
 */
export function reportPublicEnv(): EnvIssue[] {
  const issues = validatePublicEnv();
  for (const issue of issues) {
    const line = `[env] ${issue.key}: ${issue.message}`;
    if (issue.fatal) console.error(line);
    else console.warn(line);
  }
  return issues;
}
