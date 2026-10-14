// Gesture handler must be the very first import (Reanimated requirement).
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/global.css';

import { ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthGate } from '@/components/features/auth-gate';
import { colors } from '@/constants/theme';
import { bootstrapApp } from '@/lib/bootstrap';
import { AppProviders } from '@/providers/app-providers';

// Keep the native splash up until bootstrap is done. This is what gives us the
// single clean cut from splash -> fully rendered UI, with no black flash.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 180 });

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

export default function RootLayout() {
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let active = true;
    bootstrapApp().finally(() => {
      if (active) setBootstrapped(true);
    });
    return () => {
      active = false;
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
        <AppProviders>
          <ThemeProvider value={navTheme}>
            <StatusBar style="light" />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.canvas },
                  animation: 'fade',
                }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="chat/[threadId]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="ai" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="kyc-pendente" />
                <Stack.Screen name="seja-tatuador" />
              </Stack>
            </AuthGate>
          </ThemeProvider>
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
