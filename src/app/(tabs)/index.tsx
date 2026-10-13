import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, View } from 'react-native';

import { ArtistCard } from '@/components/artist-card';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { artists } from '@/data/seed';
import type { Artist } from '@/types';

function PortfolioHeader() {
  return (
    <View className="mb-5 gap-1">
      <AppText variant="label">TattooGo MK</AppText>
      <AppText variant="title">Encontre seu artista</AppText>
      <AppText variant="muted">Estúdios verificados perto de você</AppText>
    </View>
  );
}

export default function PortfolioScreen() {
  const handlePress = useCallback((artist: Artist) => {
    router.push({ pathname: '/chat/[threadId]', params: { threadId: artist.id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Artist }) => <ArtistCard artist={item} onPress={handlePress} />,
    [handlePress],
  );

  return (
    <Screen padded={false}>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={PortfolioHeader}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
      />
    </Screen>
  );
}
