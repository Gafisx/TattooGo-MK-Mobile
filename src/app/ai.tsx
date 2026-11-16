import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TattooMachineLoader } from '@/components/ui/tattoo-machine-loader';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { api, endpoints } from '@/lib/api';

function extractAiResponse(data: unknown): string {
  if (typeof data === 'string') return data.trim();
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.response === 'string') return record.response.trim();
    if (typeof record.text === 'string') return record.text.trim();
    if (typeof record.message === 'string') return record.message.trim();
    if (typeof record.reply === 'string') return record.reply.trim();
    if (typeof record.output === 'string') return record.output.trim();
    if (typeof record.content === 'string') return record.content.trim();
    if (Array.isArray(record.candidates) && record.candidates.length > 0) {
      const firstCandidate = record.candidates[0] as Record<string, unknown>;
      const parts = (firstCandidate.content as Record<string, unknown>)?.parts;
      if (Array.isArray(parts) && parts.length > 0 && typeof (parts[0] as Record<string, unknown>)?.text === 'string') {
        return ((parts[0] as Record<string, unknown>).text as string).trim();
      }
    }
  }
  return 'Ideia processada com sucesso pelo Gemini Flash! Leve esta sugestão para o seu tatuador durante a consulta.';
}

export default function AiStudioScreen() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { triggerHaptic } = useHapticFeedback();

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return;

    setLoading(true);
    setError(null);
    void triggerHaptic('medium');

    try {
      const payload = {
        prompt: trimmed,
        message: trimmed,
        messages: [{ role: 'user', content: trimmed }],
      };

      // Dispara POST /api/chat com Bearer Token ativo injetado automaticamente
      const response = await api.post<unknown>(endpoints.ai.chat(), payload, {
        auth: true,
        timeoutMs: 35000,
      });

      const reply = extractAiResponse(response);
      setAiResponse(reply);
      void triggerHaptic('success');
    } catch (err) {
      console.warn('[AiStudio] Falha ao comunicar com o Gemini Flash no BFF:', err);
      setError('Não foi possível conectar ao assistente de IA no momento. Tente novamente.');
      void triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  }, [prompt, triggerHaptic]);

  const handleReset = useCallback(() => {
    void triggerHaptic('light');
    setAiResponse(null);
    setError(null);
  }, [triggerHaptic]);

  return (
    <Screen>
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={20} color={colors.accent} />
          <AppText variant="heading">Estúdio de IA</AppText>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fechar">
          <Ionicons name="close" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}>
          {loading ? (
            <View className="mt-8 flex-1 items-center justify-center gap-5 rounded-3xl border border-line bg-card p-8">
              <TattooMachineLoader size={64} />
              <View className="items-center gap-1.5">
                <AppText variant="heading" className="text-center text-base">
                  Gemini Flash criando sua ideia...
                </AppText>
                <AppText variant="muted" className="text-center text-xs">
                  Analisando estilos, referências visuais e composição anatômica.
                </AppText>
              </View>
            </View>
          ) : aiResponse ? (
            <View className="mt-4 flex-1 gap-4">
              <View className="rounded-3xl border border-line bg-card p-5">
                <View className="mb-3 flex-row items-center justify-between border-b border-line pb-3">
                  <View className="flex-row items-center gap-2">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-accent-glow">
                      <Ionicons name="sparkles" size={14} color={colors.accent} />
                    </View>
                    <AppText variant="body" className="font-semibold text-accent">
                      Sugestão Criativa
                    </AppText>
                  </View>
                  <View className="rounded-full bg-surface px-2 py-0.5">
                    <AppText variant="muted" className="text-[10px]">
                      Gemini Flash
                    </AppText>
                  </View>
                </View>

                <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <AppText variant="body" className="leading-6 text-ink">
                    {aiResponse}
                  </AppText>
                </ScrollView>
              </View>

              <View className="gap-2.5">
                <Button
                  label="Agendar com esta ideia"
                  onPress={() => router.push('/(tabs)/agendar')}
                />
                <Button
                  label="Criar outra sugestão"
                  variant="outline"
                  onPress={handleReset}
                />
              </View>
            </View>
          ) : (
            <>
              <View className="mt-4 flex-1 items-center justify-center gap-4 rounded-3xl border border-line bg-card p-6">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-accent-glow">
                  <Ionicons name="sparkles" size={36} color={colors.accent} />
                </View>
                <AppText variant="heading" className="text-center">
                  Descreva a sua ideia
                </AppText>
                <AppText variant="muted" className="text-center text-xs leading-5">
                  Nossa IA com Gemini Flash ajuda você a transformar conceitos em referências técnicas para levar direto ao artista.
                </AppText>

                {error ? (
                  <View className="mt-2 w-full flex-row items-center gap-2 rounded-xl border border-error/40 bg-error/10 p-3">
                    <Ionicons name="alert-circle" size={18} color={colors.error} />
                    <AppText variant="muted" className="flex-1 text-xs text-error">
                      {error}
                    </AppText>
                  </View>
                ) : null}
              </View>

              <View className="mt-4 gap-3">
                <TextInput
                  value={prompt}
                  onChangeText={(text) => {
                    setPrompt(text);
                    if (error) setError(null);
                  }}
                  placeholder="Ex: Leão geométrico com elementos botânicos no antebraço em preto e cinza..."
                  placeholderTextColor={colors.muted}
                  multiline
                  className="min-h-24 rounded-2xl border border-line bg-surface p-4 text-base text-ink"
                  style={{ textAlignVertical: 'top' }}
                />
                <Button
                  label="Gerar sugestões"
                  loading={loading}
                  disabled={prompt.trim().length < 3}
                  onPress={handleGenerate}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
