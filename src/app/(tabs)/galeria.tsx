import { router } from 'expo-router';
import { useCallback } from 'react';

import { ClienteOnly } from '@/components/features/cliente-gate';
import { GaleriaInspiracoes } from '@/components/features/galeria-inspiracoes';
import { Screen } from '@/components/ui/screen';
import { useUiStore } from '@/hooks/use-ui-store';

/**
 * Tela da Galeria de Inspirações (port de `app/dashboard/galeria/galeria-client.tsx`).
 *
 * Guard: exclusiva do CLIENTE (`requireDashboardPerfil('cliente')`). Ao iniciar
 * uma conversa, entrega a intenção ao chat via store e navega para a aba de
 * chat com `{ artistId, artworkId }`, exatamente como o web fazia com a query.
 */
export default function GaleriaScreen() {
  const setActiveTab = useUiStore((state) => state.setActiveTab);
  const setPendingChatPeer = useUiStore((state) => state.setPendingChatPeer);
  const setPendingChatArtwork = useUiStore((state) => state.setPendingChatArtwork);

  const handleStartConversation = useCallback(
    (tatuadorId: string, artworkId: string) => {
      setPendingChatPeer(tatuadorId);
      setPendingChatArtwork(artworkId);
      setActiveTab('chat');
      router.push({ pathname: '/chat', params: { artistId: tatuadorId, artworkId } });
    },
    [setActiveTab, setPendingChatArtwork, setPendingChatPeer],
  );

  return (
    <ClienteOnly>
      <Screen padded={false}>
        <GaleriaInspiracoes onStartConversation={handleStartConversation} />
      </Screen>
    </ClienteOnly>
  );
}
