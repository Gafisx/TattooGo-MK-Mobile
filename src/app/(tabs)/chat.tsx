import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { api, endpoints } from '@/lib/api';
import type { ChatThread } from '@/types';

function ChatSkeletonItem() {
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View className="flex-1 gap-2">
        <Skeleton style={{ width: 120, height: 16, borderRadius: 8 }} />
        <Skeleton style={{ width: 180, height: 12, borderRadius: 6 }} />
      </View>
      <View className="items-end gap-1.5">
        <Skeleton style={{ width: 36, height: 12, borderRadius: 6 }} />
      </View>
    </View>
  );
}

function normalizeConversa(raw: unknown, index: number): ChatThread {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const artistName = String(
    record.artistName ??
      record.tatuadorNome ??
      (record.tatuador as Record<string, unknown>)?.nome ??
      (record.tatuador as Record<string, unknown>)?.name ??
      (record.participant as Record<string, unknown>)?.name ??
      (record.user as Record<string, unknown>)?.name ??
      'Artista'
  );

  const lastMessage = String(
    record.lastMessage ??
      record.ultimaMensagem ??
      (record.latestMessage as Record<string, unknown>)?.text ??
      (record.latestMessage as Record<string, unknown>)?.conteudo ??
      record.message ??
      'Conversa iniciada'
  );

  let formattedDate = 'Hoje';
  const rawDate = record.updatedAt ?? record.updated_at ?? record.data_atualizacao ?? record.createdAt;
  if (rawDate) {
    try {
      const d = new Date(String(rawDate));
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      formattedDate = String(rawDate);
    }
  }

  return {
    id: String(record.id ?? record._id ?? record.threadId ?? record.conversaId ?? `conversa-${index + 1}`),
    artistName,
    lastMessage,
    updatedAt: formattedDate,
    unread: Number(record.unread ?? record.naoLidas ?? record.unreadCount ?? 0),
  };
}

export default function ChatScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<ChatThread[]>({
    queryKey: ['chat', 'conversas'],
    queryFn: async () => {
      const payload = await api.get<unknown>(endpoints.chat.conversas(), { auth: true });
      const rawList = Array.isArray(payload)
        ? payload
        : typeof payload === 'object' && payload !== null
        ? Array.isArray((payload as Record<string, unknown>).conversas)
          ? ((payload as Record<string, unknown>).conversas as unknown[])
          : Array.isArray((payload as Record<string, unknown>).items)
          ? ((payload as Record<string, unknown>).items as unknown[])
          : Array.isArray((payload as Record<string, unknown>).threads)
          ? ((payload as Record<string, unknown>).threads as unknown[])
          : []
        : [];
      return rawList.map(normalizeConversa);
    },
    staleTime: 10 * 1000,
    refetchInterval: 8 * 1000,
  });

  const chatThreads = data ?? [];

  const openThread = useCallback((thread: ChatThread) => {
    router.push({ pathname: '/chat/[threadId]', params: { threadId: thread.id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ChatThread }) => (
      <Pressable
        onPress={() => openThread(item)}
        className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-card p-4 active:bg-elevated">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-glow">
          <Ionicons name="person" size={20} color={colors.accent} />
        </View>
        <View className="flex-1 gap-1">
          <AppText variant="body" className="font-semibold">
            {item.artistName}
          </AppText>
          <AppText variant="muted" numberOfLines={1}>
            {item.lastMessage}
          </AppText>
        </View>
        <View className="items-end gap-1">
          <AppText variant="muted" className="text-xs">
            {item.updatedAt}
          </AppText>
          {item.unread > 0 ? (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5">
              <AppText className="text-xs font-bold text-canvas">{item.unread}</AppText>
            </View>
          ) : null}
        </View>
      </Pressable>
    ),
    [openThread],
  );

  return (
    <Screen padded={false}>
      <View className="px-5 pt-2">
        <AppText variant="title">Conversas</AppText>
      </View>

      {isLoading && chatThreads.length === 0 ? (
        <View className="p-5">
          {[1, 2, 3, 4].map((key) => (
            <ChatSkeletonItem key={key} />
          ))}
        </View>
      ) : (
        <FlatList
          data={chatThreads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            isError ? (
              <View className="flex-1 items-center justify-center gap-4 py-16">
                <EmptyState
                  icon="cloud-offline-outline"
                  title="Erro ao sincronizar conversas"
                  description="Verifique a sua conexão com a internet."
                />
                <Button label="Tentar novamente" onPress={() => refetch()} />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center gap-4 py-16">
                <EmptyState
                  icon="chatbubbles-outline"
                  title="Nenhuma conversa ainda"
                  description="Fale com um artista para iniciar uma conversa."
                />
                <Button label="Encontrar artistas" onPress={() => router.push('/(tabs)')} />
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}
