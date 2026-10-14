import { ClerkProvider } from '@clerk/clerk-expo';
import type { ReactNode } from 'react';

import { clerkPublishableKey, isAuthConfigured } from '@/lib/env';
import { tokenCache } from '@/lib/clerk-token-cache';
import { QueryProvider } from '@/providers/query-provider';

// Re-exported from the env module so existing consumers keep a single import
// path (`@/providers/app-providers`) for the auth-configured flag.
export { isAuthConfigured };

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root providers. Clerk is mounted only when a publishable key is present so
 * the shell can still boot (and stay inspectable) before credentials are wired.
 * React Query is always mounted so data screens work with or without auth.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const content = clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  ) : (
    <>{children}</>
  );

  return <QueryProvider>{content}</QueryProvider>;
}
