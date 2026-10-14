import { AgendaPaymentsWorkspace } from '@/components/features/agenda-payments-workspace';
import { Screen } from '@/components/ui/screen';

/**
 * Aba "Agenda" do Dashboard do Estúdio.
 *
 * Reutiliza o `AgendaPaymentsWorkspace` já pronto com `viewerRole="estudio"`,
 * que renderiza a agenda do estúdio (`StudioAgendaView`) e o painel de
 * recebimentos (`StudioPaymentsPanel`) no mesmo seletor segmentado.
 */
export default function EstudioAgendaScreen() {
  return (
    <Screen padded={false}>
      <AgendaPaymentsWorkspace viewerRole="estudio" />
    </Screen>
  );
}
