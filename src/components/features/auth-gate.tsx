import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { parseAppRole } from '@/lib/utils/dashboard-gate';
import { isAuthConfigured } from '@/providers/app-providers';

function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/**
 * Portão de entrada nativo (equivalente ao middleware/layout raiz da Web).
 *
 * Mantém as rotas de `(auth)` fora das `(tabs)` para utilizadores não
 * autenticados e encaminha quem está autenticado sem `role` para o `onboarding`.
 * Só é montado quando o Clerk está configurado (`isAuthConfigured`).
 */
function ClerkAuthGate({ children }: { children: ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const segments = useSegments();
  const router = useRouter();

  const isLoaded = authLoaded && userLoaded;

  const publicMetadata = (user?.publicMetadata ?? {}) as Record<string, unknown>;
  const unsafeMetadata = (user?.unsafeMetadata ?? {}) as Record<string, unknown>;
  const role = parseAppRole(publicMetadata.role) ?? parseAppRole(unsafeMetadata.role);

  useEffect(() => {
    if (!isLoaded) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inOnboarding = root === 'onboarding';

    if (!isSignedIn) {
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    if (!role) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    if (inAuthGroup || inOnboarding) router.replace('/');
  }, [isLoaded, isSignedIn, role, segments, router]);

  if (!isLoaded) return <Loading />;

  return <>{children}</>;
}

/**
 * Em modo de desenvolvimento (sem `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) o portão
 * libera a navegação, mantendo o app inspecionável — mesma semântica dos gates
 * `ClienteOnly`/`TatuadorKycGate`.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  if (!isAuthConfigured) return <>{children}</>;
  return <ClerkAuthGate>{children}</ClerkAuthGate>;
}
