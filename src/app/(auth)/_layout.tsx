import { Stack } from 'expo-router';

import { colors } from '@/constants/theme';

/**
 * Auth stack (login / register). Lives outside the `(tabs)` layout so it is only
 * reachable by unauthenticated users — the root `AuthGate` handles the redirect.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    />
  );
}
