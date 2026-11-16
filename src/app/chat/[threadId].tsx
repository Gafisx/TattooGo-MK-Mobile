import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { api, endpoints } from '@/lib/api';

interface Message {
  id: string;
  mine: boolean;
  text: string;
  createdAt?: string;
}

function normalizeMessage(raw: unknown, currentUserId?: string | null): Message {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const isMine =
    typeof record.mine === 'boolean'
      ? record.mine
      : typeof record.isMine === 'boolean'
      ? record.isMine
      : typeof record.isClient === 'boolean'
      ? record.isClient
      : currentUserId &&
        (record.senderId === currentUserId ||
          record.remetenteId === currentUserId ||
          record.userId === currentUserId ||
          record.authorId === currentUserId)
      ? true
      : record.role === 'user' || record.remetente === 'cliente' || record.senderType === 'user';

  return {
    id: String(record.id ?? record._id ?? `msg-${Date.now()}-${Math.random()}`),
    mine: Boolean(isMine),
    text: String(record.text ?? record.mensagem ?? record.conteudo ?? record.content ?? ''),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : typeof record.created_at === 'string' ? record.created_at : undefined,
  };
}

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useUser();
  const { triggerHaptic } = useHapticFeedback();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Busca o histórico real de mensagens do BFF via GET /api/chat/historico?conversaId=:id
  const {
    data: remoteMessages,
    isLoading,
    isError,
    refetch,
  } = useQuery<Message[]>({
    queryKey: ['chat', 'historico', threadId],
    queryFn: async () => {
      const payload = await api.get<unknown>(endpoints.chat.historico(threadId), { auth: true });
      const rawList = Array.isArray(payload)
        ? payload
        : typeof payload === 'object' && payload !== null
        ? Array.isArray((payload as Record<string, unknown>).mensagens)
          ? ((payload as Record<string, unknown>).mensagens as unknown[])
          : Array.isArray((payload as Record<string, unknown>).messages)
          ? ((payload as Record<string, unknown>).messages as unknown[])
          : Array.isArray((payload as Record<string, unknown>).items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : []
        : [];
      return rawList.map((item) => normalizeMessage(item, user?.id));
    },
    enabled: !!threadId,
    staleTime: 4 * 1000,
    refetchInterval: 4 * 1000,
  });

  // Combina mensagens persistidas com mensagens enviadas com otimismo local
  const messages = [...(remoteMessages ?? []), ...localMessages];

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isSending || !threadId) return;

    void triggerHaptic('medium');
    setDraft('');
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      mine: true,
      text,
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, optimisticMessage]);

    try {
      const payload = {
        conversaId: threadId,
        threadId,
        mensagem: text,
        text,
        content: text,
      };

      // Dispara POST /api/chat/enviar com Bearer Token ativo do Clerk
      await api.post<unknown>(endpoints.chat.enviar(), payload, {
        auth: true,
        timeoutMs: 15000,
      });

      await queryClient.invalidateQueries({ queryKey: ['chat', 'historico', threadId] });
      setLocalMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      void triggerHaptic('success');
    } catch (err) {
      console.warn('[ChatThread] Falha ao enviar mensagem via BFF:', err);
      void triggerHaptic('error');
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, threadId, triggerHaptic, queryClient]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    return (
      <View
        className={`my-1 max-w-[80%] rounded-2xl px-4 py-2.5 ${
          item.mine ? 'self-end bg-accent' : 'self-start border border-line bg-card'
        }`}>
        <AppText variant="body" className={item.mine ? 'font-medium text-canvas' : 'text-ink'}>
          {item.text}
        </AppText>
      </View>
    );
  }, []);

  return (
    <Screen padded={false}>
      <View className="flex-row items-center gap-3 border-b border-line px-4 py-3">
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-accent-glow">
          <Ionicons name="person" size={18} color={colors.accent} />
        </View>
        <View className="flex-1">
          <AppText variant="body" className="font-semibold">
            Conversa com Artista
          </AppText>
          <AppText variant="muted" className="text-xs">
            Canal blindado • Ativo
          </AppText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center gap-2 py-12">
                <Ionicons name="chatbubbles-outline" size={36} color={colors.muted} />
                <AppText variant="muted" className="text-center text-xs">
                  {isError
                    ? 'Não foi possível carregar o histórico de mensagens.'
                    : 'Inicie a conversa enviando uma mensagem para o artista.'}
                </AppText>
                {isError && (
                  <Pressable onPress={() => refetch()} className="mt-2 rounded-full border border-line px-3 py-1 bg-surface">
                    <AppText variant="body" className="text-xs text-accent">Tentar novamente</AppText>
                  </Pressable>
                )}
              </View>
            }
          />
        )}

        <View className="flex-row items-center gap-2 border-t border-line px-4 py-3 bg-canvas">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={colors.muted}
            className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-base text-ink"
            onSubmitEditing={handleSend}
            returnKeyType="send"
            editable={!isSending}
          />
          <Pressable
            disabled={!draft.trim() || isSending}
            className={`h-11 w-11 items-center justify-center rounded-full ${
              draft.trim() && !isSending ? 'bg-accent active:bg-accent-strong' : 'bg-elevated opacity-50'
            }`}
            onPress={handleSend}>
            {isSending ? (
              <ActivityIndicator size="small" color={colors.canvas} />
            ) : (
              <Ionicons name="send" size={18} color={draft.trim() ? colors.canvas : colors.muted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
