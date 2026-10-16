// Gesture handler must be the very first import (Reanimated requirement).
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/global.css';

import { ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { useAuthGuardState } from '@/components/features/auth-gate';
import { DeviceTrustGuard } from '@/components/features/device-trust-guard';
import { ToastContainer } from '@/components/ui/toast-container';
import { colors } from '@/constants/theme';
import { bootstrapApp } from '@/lib/bootstrap';
import { AppProviders, isAuthConfigured } from '@/providers/app-providers';

// Keep the native splash up until bootstrap is done. This is what gives us the
// single clean cut from splash -> fully rendered UI, with no black flash.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 180 });

// Hard ceiling on the splash gate. If bootstrap stalls (storage/network), we
// still reveal the shell instead of dead-ending on an infinite black screen.
const BOOTSTRAP_TIMEOUT_MS = 8000;

const navTheme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.canvas,
    card: colors.canvas,
    text: colors.ink,
    border: colors.line,
    notification: colors.accent,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '800' as const },
  },
};

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.canvas },
  animation: 'fade',
} as const;

function Loading() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.canvas,
      }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/**
 * Inspectable development navigator (no `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`).
 * Every route stays reachable so the shell can be reviewed without auth.
 */
function DevStack() {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[threadId]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ai" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="kyc-pendente" />
      <Stack.Screen name="seja-tatuador" />
    </Stack>
  );
}

/**
 * Auth-guarded navigator.
 *
 * `Stack.Protected` removes a screen from the navigation tree entirely while its
 * `guard` is false. That is what kills the flicker: a signed-out user can never
 * mount a single frame of `(tabs)` before being sent to `(auth)`. The router
 * redirects to the first available screen (login) by itself — no imperative
 * `router.replace` in an effect, and therefore no post-paint race.
 *
 * Cascade: signed out -> `(auth)`; signed in without a role -> `onboarding`;
 * signed in with a role -> the app (`(tabs)` + deep routes).
 */
function GuardedStack({ signedIn, hasRole }: { signedIn: boolean; hasRole: boolean }) {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn}>
        <Stack.Protected guard={!hasRole}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        <Stack.Protected guard={hasRole}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[threadId]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="ai" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="kyc-pendente" />
          <Stack.Screen name="seja-tatuador" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}

/** Only mounted when Clerk is configured, so `useAuth`/`useUser` are safe. */
function ClerkNavigator() {
  const { ready, signedIn, hasRole } = useAuthGuardState();

  // Hold on the boot spinner until the guards can be evaluated against a real
  // session — never render the guarded tree with an unknown auth state.
  if (!ready) return <Loading />;

  return <GuardedStack signedIn={signedIn} hasRole={hasRole} />;
}

function RootNavigator() {
  if (!isAuthConfigured) return <DevStack />;
  return <ClerkNavigator />;
}

export default function RootLayout() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;
    const reveal = () => {
      if (active) setBootstrapped(true);
    };
    const timeout = setTimeout(() => {
      console.warn('[app] bootstrap excedeu o tempo limite; a revelar a UI.');
      reveal();
    }, BOOTSTRAP_TIMEOUT_MS);

    bootstrapApp()
      .catch((error) => {
        console.error('[app] bootstrap falhou:', error);
      })
      .finally(() => {
        clearTimeout(timeout);
        reveal();
      });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (bootstrapped) {
      // The first real frame is committed; safe to reveal it.
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [bootstrapped]);

  // While the native splash is visible the canvas is already #0a0a0a, so
  // rendering nothing here is intentional and never shows as a blank screen.
  if (!bootstrapped) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AppProviders>
            <BottomSheetModalProvider>
              <ThemeProvider value={navTheme}>
                <StatusBar style="light" />
                <DeviceTrustGuard>
                  <RootNavigator />
                </DeviceTrustGuard>
                <ToastContainer />
              </ThemeProvider>
            </BottomSheetModalProvider>
          </AppProviders>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
