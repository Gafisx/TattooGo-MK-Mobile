import { useAuth } from '@clerk/clerk-expo';
import { ShieldAlert } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme';
import { useI18n } from '@/hooks/use-i18n';
import { kycDescriptor, type KycStatus, type KycTone } from '@/lib/kyc';
import { isAuthConfigured } from '@/providers/app-providers';

const TONE: Record<KycTone, { iconBg: string; color: string }> = {
  warning: { iconBg: 'bg-warning/15', color: colors.warning },
  info: { iconBg: 'bg-info/15', color: colors.info },
  danger: { iconBg: 'bg-danger/15', color: colors.danger },
  success: { iconBg: 'bg-success/15', color: colors.success },
  muted: { iconBg: 'bg-elevated', color: colors.muted },
};

function ClerkSignOutButton({ label }: { label: string }) {
  const { signOut } = useAuth();
  return (
    <Button
      label={label}
      variant="secondary"
      onPress={() => {
        void signOut().catch(() => {});
      }}
    />
  );
}

function SignOutButton() {
  const { t } = useI18n();
  // `useAuth` exige ClerkProvider; sem chave configurada o botão é inerte.
  if (!isAuthConfigured) {
    return <Button label={t('kyc.signOut')} variant="secondary" onPress={() => {}} />;
  }
  return <ClerkSignOutButton label={t('kyc.signOut')} />;
}

export interface TatuadorKycBlockProps {
  status: KycStatus;
}

/**
 * Bloqueio visual de KYC (port de `TatuadorKycBlock`).
 *
 * Cobre a tela inteira com o canvas "dark luxury", exibe o ícone `ShieldAlert`,
 * o título/mensagem do i18n (`kyc.*`) para cada um dos 5 estados e um botão de
 * `auth.signOut` no rodapé. A transição de `fade-in` (`opacity`) via
 * `react-native-reanimated` roda na montagem e a cada mudança de status.
 */
export function TatuadorKycBlock({ status }: TatuadorKycBlockProps) {
  const { t } = useI18n();
  const descriptor = kycDescriptor(status);
  const tone = TONE[descriptor.tone];

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 280 });
  }, [status, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.canvas }}
      edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        <View className="flex-1 items-center justify-center px-8">
          <View className={`h-24 w-24 items-center justify-center rounded-3xl ${tone.iconBg}`}>
            <ShieldAlert size={40} color={tone.color} />
          </View>
          <AppText variant="label" className="mt-6">
            {t('kyc.blockTitle')}
          </AppText>
          <AppText variant="heading" className="mt-2 text-center">
            {t(descriptor.titleKey)}
          </AppText>
          <AppText variant="muted" className="mt-3 text-center">
            {t(descriptor.messageKey)}
          </AppText>
        </View>
      </Animated.View>

      <View className="px-8 pb-6">
        <SignOutButton />
      </View>
    </SafeAreaView>
  );
}
