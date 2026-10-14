import { AgendaPaymentsWorkspace } from '@/components/features/agenda-payments-workspace';
import { Screen } from '@/components/ui/screen';

/**
 * Fundação do Dashboard do tatuador.
 *
 * Renderiza a agenda do estúdio através do workspace compartilhado, que detecta
 * o perfil studio e delega para a `StudioAgendaView` ("Hoje" / "Próximos").
 */
export default function TatuadorDashboardScreen() {
  return (
    <Screen padded={false}>
      <AgendaPaymentsWorkspace viewerRole="tatuador" />
    </Screen>
  );
}
