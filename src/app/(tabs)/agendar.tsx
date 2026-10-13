import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { formatBRL, splitPayment } from '@/lib/finance';

const PREVIEW_CENTS = 45000;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 rounded-2xl border border-line bg-card p-4">
      <AppText variant="label">{label}</AppText>
      <View className="flex-row items-center justify-between">
        <AppText variant="body">{value}</AppText>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </View>
  );
}

export default function AgendarScreen() {
  const split = splitPayment(PREVIEW_CENTS);

  return (
    <Screen>
      <View className="mt-2 gap-1">
        <AppText variant="label">Novo agendamento</AppText>
        <AppText variant="title">Reserve a sua sessão</AppText>
      </View>

      <View className="mt-6 gap-3">
        <Field label="Artista" value="Selecione um artista" />
        <Field label="Estilo" value="Escolha o estilo" />
        <Field label="Data" value="Defina data e horário" />
      </View>

      <View className="mt-6 gap-2 rounded-2xl border border-line bg-surface p-4">
        <AppText variant="label">Resumo do sinal</AppText>
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Tatuador (90%)</AppText>
          <AppText variant="body">{formatBRL(split.artistCents)}</AppText>
        </View>
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Plataforma (9%)</AppText>
          <AppText variant="body">{formatBRL(split.platformCents)}</AppText>
        </View>
        <View className="flex-row items-center justify-between">
          <AppText variant="muted">Estúdio (1%)</AppText>
          <AppText variant="body">{formatBRL(split.studioCents)}</AppText>
        </View>
        <View className="mt-2 flex-row items-center justify-between border-t border-line pt-3">
          <AppText variant="body" className="font-semibold">
            Total
          </AppText>
          <AppText variant="body" className="font-semibold text-accent">
            {formatBRL(split.grossCents)}
          </AppText>
        </View>
      </View>

      <View className="mt-auto pb-6">
        <Button label="Continuar" onPress={() => {}} />
      </View>
    </Screen>
  );
}
