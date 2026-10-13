import { ClerkProvider } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';

import { tokenCache } from '@/lib/clerk-token-cache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Whether native Clerk auth is configured for this build. */
export const isAuthConfigured = Boolean(publishableKey);

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root providers. Clerk is mounted only when a publishable key is present so
 * the shell can still boot (and stay inspectable) before credentials are wired.
 */
export function AppProviders({ children }: AppProvidersProps) {
  if (!publishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
