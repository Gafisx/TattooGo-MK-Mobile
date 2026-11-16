import { router } from 'expo-router';
import { useCallback } from 'react';

import { AgendaPaymentsWorkspace } from '@/components/features/agenda-payments-workspace';
import { ClienteOnly } from '@/components/features/cliente-gate';
import { Screen } from '@/components/ui/screen';
import { useUiStore } from '@/hooks/use-ui-store';

/**
 * Workspace de Agendamentos e Pagamentos do cliente (conectado à rota oficial `/api/agendamentos` do BFF).
 *
 * Guard: exclusiva do CLIENTE (`requireDashboardPerfil('cliente')`). O workspace
 * gerencia o seletor segmentado Agendamentos | Pagamentos e renderiza o
 * rastreador de timeline (`ClientTimelineTracker`) em tempo real.
 */
export default function AgendarScreen() {
  const setActiveTab = useUiStore((state) => state.setActiveTab);

  const handleStartBooking = useCallback(() => {
    setActiveTab('index');
    router.push('/(tabs)');
  }, [setActiveTab]);

  return (
    <ClienteOnly blockedDescription="A agenda de agendamentos é exclusiva para clientes.">
      <Screen padded={false}>
        <AgendaPaymentsWorkspace onStartBooking={handleStartBooking} />
      </Screen>
    </ClienteOnly>
  );
}
