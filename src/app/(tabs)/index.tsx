import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { ArtistCard } from '@/components/artist-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/constants/theme';
import { api, endpoints } from '@/lib/api';
import type { Artist } from '@/types';

function PortfolioHeader() {
  return (
    <View className="mb-5 gap-1">
      <AppText variant="label">TattooGo MK</AppText>
      <AppText variant="title">Encontre seu artista</AppText>
      <AppText variant="muted">Estúdios e tatuadores verificados em tempo real</AppText>
    </View>
  );
}

/** Shimmer loader no padrão Luxury para manter a fluidez visual antes do primeiro frame de dados. */
function LuxurySkeletonItem() {
  return (
    <View className="mb-4 flex-row items-center gap-4 rounded-2xl border border-line bg-card p-4">
      <Skeleton style={{ width: 56, height: 56, borderRadius: 28 }} />
      <View className="flex-1 gap-2">
        <Skeleton style={{ width: 140, height: 16, borderRadius: 8 }} />
        <Skeleton style={{ width: 100, height: 12, borderRadius: 6 }} />
        <Skeleton style={{ width: 80, height: 10, borderRadius: 6 }} />
      </View>
      <View className="items-end gap-1.5">
        <Skeleton style={{ width: 50, height: 10, borderRadius: 6 }} />
        <Skeleton style={{ width: 65, height: 16, borderRadius: 8 }} />
      </View>
    </View>
  );
}

/** Normaliza respostas variadas do BFF (feed/nearby) para o contrato canônico `Artist`. */
function normalizeArtist(raw: Record<string, unknown>, index: number): Artist {
  const stylesList: string[] = Array.isArray(raw.styles)
    ? (raw.styles as unknown[]).map(String)
    : Array.isArray(raw.estilos)
    ? (raw.estilos as unknown[]).map(String)
    : typeof raw.style === 'string'
    ? [raw.style]
    : ['Tattoo', 'Realismo'];

  const rawName = typeof raw.name === 'string' ? raw.name : typeof raw.nome === 'string' ? raw.nome : 'Artista';
  const defaultHandle = `@${rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || `artista${index + 1}`}`;

  return {
    id: String(raw.id ?? raw._id ?? `artist-${index + 1}`),
    name: rawName,
    handle: typeof raw.handle === 'string' ? raw.handle : typeof raw.username === 'string' ? raw.username : defaultHandle,
    city: String(raw.city ?? raw.cidade ?? raw.location ?? 'São Paulo, SP'),
    styles: stylesList,
    priceFromCents: Number(raw.priceFromCents ?? raw.price_cents ?? raw.preco_minimo ?? raw.precoMinimo ?? 35000),
    rating: Number(raw.rating ?? raw.avaliacao ?? 5.0),
    artworks: Number(raw.artworks ?? raw.obras ?? raw.artworks_count ?? 12),
    verified: Boolean(raw.verified ?? raw.verificado ?? true),
  };
}

async function fetchHomeArtists(): Promise<Artist[]> {
  try {
    // Tenta primeiro o endpoint oficial de feed do BFF
    const response = await api
      .get<unknown>(endpoints.feed.list(), { auth: false })
      .catch(async () => {
        // Fallback automático para o endpoint de proximidade (nearby)
        return await api.get<unknown>(endpoints.artistas.nearby(), { auth: false });
      });

    const rawList = Array.isArray(response)
      ? response
      : typeof response === 'object' && response !== null
      ? Array.isArray((response as Record<string, unknown>).items)
        ? ((response as Record<string, unknown>).items as unknown[])
        : Array.isArray((response as Record<string, unknown>).artistas)
        ? ((response as Record<string, unknown>).artistas as unknown[])
        : Array.isArray((response as Record<string, unknown>).data)
        ? ((response as Record<string, unknown>).data as unknown[])
        : []
      : [];

    return rawList
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map(normalizeArtist);
  } catch (error) {
    console.warn('[HomeFeed] Falha ao carregar artistas do BFF:', error);
    throw error;
  }
}

export default function PortfolioScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery<Artist[]>({
    queryKey: ['home', 'artists-feed'],
    queryFn: fetchHomeArtists,
    staleTime: 60 * 1000,
  });

  const artists = data ?? [];

  const handlePress = useCallback((artist: Artist) => {
    router.push({ pathname: '/chat/[threadId]', params: { threadId: artist.id } });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Artist }) => <ArtistCard artist={item} onPress={handlePress} />,
    [handlePress],
  );

  return (
    <Screen padded={false}>
      {isLoading && artists.length === 0 ? (
        <View className="p-5">
          <PortfolioHeader />
          {[1, 2, 3, 4, 5].map((key) => (
            <LuxurySkeletonItem key={key} />
          ))}
        </View>
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={PortfolioHeader}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews
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
                  title="Conexão indisponível"
                  description="Não foi possível sincronizar o feed com o BFF. Tente novamente."
                />
                <Button label="Recarregar feed" onPress={() => refetch()} />
              </View>
            ) : (
              <View className="flex-1 items-center justify-center gap-4 py-16">
                <EmptyState
                  icon="search-outline"
                  title="Nenhum artista encontrado"
                  description="Novos estúdios e tatuadores estarão disponíveis em breve."
                />
                <Button label="Atualizar" onPress={() => refetch()} />
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}
