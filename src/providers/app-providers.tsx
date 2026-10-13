import { ClerkProvider } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';

import { tokenCache } from '@/lib/clerk-token-cache';
import { QueryProvider } from '@/providers/query-provider';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Whether native Clerk auth is configured for this build. */
export const isAuthConfigured = Boolean(publishableKey);

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root providers. Clerk is mounted only when a publishable key is present so
 * the shell can still boot (and stay inspectable) before credentials are wired.
 * React Query is always mounted so data screens work with or without auth.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const content = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  ) : (
    <>{children}</>
  );

  return <QueryProvider>{content}</QueryProvider>;
}
