import { useAuth, useUser } from '@clerk/clerk-expo';

import { parseAppRole } from '@/lib/utils/dashboard-gate';

export interface AuthGuardState {
  /** `true` once Clerk has resolved both the session and the profile. */
  ready: boolean;
  signedIn: boolean;
  /** A role was chosen/reconciled; when `false` the user belongs in onboarding. */
  hasRole: boolean;
}

/**
 * Single source of truth for the root navigation guards.
 *
 * The guards feed `Stack.Protected` in the root layout, which is what makes the
 * redirect flicker-free: while a guard is `false` the protected screens are
 * never mounted, so an unauthenticated user can't see a single frame of the
 * tabs before being bounced to `(auth)`.
 *
 * Must only be called inside a `ClerkProvider` (i.e. when `isAuthConfigured`).
 * The inspectable development pass-through lives in the root layout.
 */
export function useAuthGuardState(): AuthGuardState {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const publicMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const unsafeMetadata = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;
  const role = parseAppRole(publicMetadata.role) ?? parseAppRole(unsafeMetadata.role);

  return {
    ready: authLoaded && userLoaded,
    signedIn: isSignedIn === true,
    hasRole: role !== null,
  };
}
