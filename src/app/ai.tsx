import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';

export default function AiStudioScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-2">
        <AppText variant="heading">Estúdio de IA</AppText>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View className="mt-4 flex-1 items-center justify-center gap-4 rounded-3xl border border-line bg-card p-6">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent-glow">
          <Ionicons name="sparkles" size={36} color={colors.accent} />
        </View>
        <AppText variant="heading" className="text-center">
          Descreva a sua ideia
        </AppText>
        <AppText variant="muted" className="text-center">
          A IA sugere referências visuais que você leva direto para o agendamento.
        </AppText>
      </View>

      <View className="mt-4 gap-3">
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Ex: leão realista em preto e cinza no antebraço"
          placeholderTextColor={colors.muted}
          multiline
          className="min-h-24 rounded-2xl border border-line bg-surface p-4 text-base text-ink"
          style={{ textAlignVertical: 'top' }}
        />
        <Button
          label="Gerar sugestões"
          loading={loading}
          disabled={prompt.trim().length < 3}
          onPress={() => setLoading(false)}
        />
      </View>
    </Screen>
  );
}
