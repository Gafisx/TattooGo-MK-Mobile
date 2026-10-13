import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/constants/theme';
import { chatThreads } from '@/data/seed';
import type { ChatThread } from '@/types';

export default function ChatScreen() {
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
      <FlatList
        data={chatThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="Nenhuma conversa ainda"
            description="Fale com um artista para começar."
          />
        }
      />
    </Screen>
  );
}
