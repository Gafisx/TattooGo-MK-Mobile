import * as Device from 'expo-device';
import { ShieldAlert } from 'lucide-react-native';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

/** Enforcement copy shown when the runtime environment is rejected. */
const BLOCK_LABEL = 'Segurança';
const BLOCK_TITLE = 'Ambiente Não Seguro Detectado';
const BLOCK_MESSAGE =
  'Este aplicativo requer um dispositivo físico íntegro para rodar.';

type TrustStatus = 'checking' | 'trusted' | 'untrusted';

/** Neutral gate shown for the brief moment the root probe is in flight. */
function VerifyingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

/**
 * Fail-closed violation screen.
 *
 * Deliberately covers the entire surface with the "dark luxury" canvas so the
 * protected tree (navigation, login, secrets) is never mounted behind it.
 */
function DeviceTrustBlock() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 280 });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
          animatedStyle,
        ]}>
        <View className="w-full max-w-md items-center rounded-2xl border border-line bg-surface/80 p-6">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-danger/15">
            <ShieldAlert size={40} color={colors.danger} />
          </View>
          <AppText variant="label" className="mt-6">
            {BLOCK_LABEL}
          </AppText>
          <AppText variant="heading" className="mt-2 text-center">
            {BLOCK_TITLE}
          </AppText>
          <AppText variant="muted" className="mt-3 text-center">
            {BLOCK_MESSAGE}
          </AppText>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export interface DeviceTrustGuardProps {
  children: ReactNode;
}

/**
 * Anti-spoofing / anti-tamper gate for the whole app.
 *
 * Blocks two untrusted runtimes:
 *  - Emulators & clone farms (`Device.isDevice === false`), so tools like
 *    BlueStacks or a desktop simulator can't drive the app. `__DEV__` is the
 *    single escape hatch, keeping the local developer workflow (Expo Go,
 *    Simulator) usable.
 *  - Rooted / jailbroken OS (`Device.isRootedExperimentalAsync`), always
 *    rejected regardless of build flavor because that's where credential
 *    theft and hooking live.
 *
 * While the async probe is unresolved the children stay unmounted, so nothing
 * sensitive is ever painted before the verdict is in.
 */
export function DeviceTrustGuard({ children }: DeviceTrustGuardProps) {
  // Simulators/emulators are only tolerated on developer builds.
  const physicalDevice = Device.isDevice || __DEV__;
  const [status, setStatus] = useState<TrustStatus>(
    physicalDevice ? 'checking' : 'untrusted',
  );

  useEffect(() => {
    if (!physicalDevice) return;

    let mounted = true;

    Device.isRootedExperimentalAsync()
      .then((rooted) => {
        if (mounted) setStatus(rooted ? 'untrusted' : 'trusted');
      })
      .catch((error) => {
        // The probe is documented as unreliable and can throw when system files
        // aren't readable. Failing open here avoids bricking legitimate devices.
        console.warn('[device-trust-guard] root detection falhou:', error);
        if (mounted) setStatus('trusted');
      });

    return () => {
      mounted = false;
    };
  }, [physicalDevice]);

  if (status === 'trusted') return <>{children}</>;
  if (status === 'checking') return <VerifyingScreen />;
  return <DeviceTrustBlock />;
}
