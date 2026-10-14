import { router } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

const DEFAULT_MESSAGE =
  'O Clerk não está configurado neste build. Defina EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY para ativar o registo e o login.';

/**
 * Dev fallback rendered when `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is absent, so
 * the auth routes stay navigable (mirroring the pass-through behaviour of the
 * role/KYC gates) instead of throwing outside a `ClerkProvider`.
 */
export function AuthDevNotice({
  title = 'Autenticação indisponível',
  message = DEFAULT_MESSAGE,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-accent-glow">
          <ShieldAlert size={28} color={colors.accent} />
        </View>
        <AppText variant="heading" className="text-center">
          {title}
        </AppText>
        <AppText variant="muted" className="text-center">
          {message}
        </AppText>
      </View>
      <Button label="Continuar em modo de desenvolvimento" onPress={() => router.replace('/')} />
    </Screen>
  );
}
