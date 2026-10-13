import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

const steps = [
  { label: 'Documentos enviados', done: true },
  { label: 'Análise da plataforma', done: true },
  { label: 'Verificação em andamento', done: false },
] as const;

export default function KycPendenteScreen() {
  return (
    <Screen>
      <View className="flex-row items-center justify-between py-2">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <AppText variant="heading">Verificação</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View className="mt-6 items-center gap-3">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent-glow">
          <Ionicons name="hourglass" size={34} color={colors.accent} />
        </View>
        <AppText variant="heading">Análise em andamento</AppText>
        <AppText variant="muted" className="text-center">
          Isso costuma levar até 48 horas. Você será notificado assim que concluir.
        </AppText>
      </View>

      <View className="mt-8 gap-3">
        {steps.map((step) => (
          <View
            key={step.label}
            className="flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4">
            <Ionicons
              name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={step.done ? colors.success : colors.muted}
            />
            <AppText variant="body" className={step.done ? 'text-ink' : 'text-subtle'}>
              {step.label}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
