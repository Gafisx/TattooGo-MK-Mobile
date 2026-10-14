import { isClerkAPIResponseError } from '@clerk/clerk-expo';

const DEFAULT_FALLBACK = 'Não foi possível concluir. Tente novamente.';

/**
 * Extracts a human-readable message from a Clerk/thrown error without leaking
 * the raw API payload into the UI. Mirrors the web error handling that reads the
 * first `longMessage` (falling back to `message`).
 */
export function clerkErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0];
    const message = first?.longMessage ?? first?.message;
    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
