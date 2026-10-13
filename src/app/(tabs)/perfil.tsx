import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

export default function PerfilScreen() {
  return (
    <Screen padded={false}>
      <View className="px-5 pt-2">
        <View className="flex-row items-center gap-4 py-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-accent-glow">
            <Ionicons name="person" size={28} color={colors.accent} />
          </View>
          <View className="gap-1">
            <AppText variant="heading">Convidado</AppText>
            <AppText variant="muted">Entre para salvar seus agendamentos</AppText>
          </View>
        </View>
      </View>

      <View className="px-5">
        <Button label="Entrar" onPress={() => {}} />
      </View>

      <View className="mt-6 px-5">
        <AppText variant="label" className="mb-2">
          Conta
        </AppText>
        <ListRow
          icon="sparkles-outline"
          title="Estúdio de IA"
          subtitle="Gere ideias de tatuagem"
          onPress={() => router.push('/ai')}
        />
        <ListRow
          icon="shield-checkmark-outline"
          title="Seja um tatuador"
          subtitle="Envie seus dados e CNPJ"
          onPress={() => router.push('/seja-tatuador')}
        />
        <ListRow
          icon="hourglass-outline"
          title="Verificação KYC"
          subtitle="Acompanhe o status"
          onPress={() => router.push('/kyc-pendente')}
        />
        <ListRow icon="settings-outline" title="Preferências" subtitle="Tema e idioma" />
      </View>
    </Screen>
  );
}
