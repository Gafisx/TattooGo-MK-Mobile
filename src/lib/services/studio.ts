import { api, endpoints } from '@/lib/api';
import { studioPartners, studioPedidos } from '@/data/studio-seed';
import type {
  PedidoDecision,
  PedidoStatus,
  StudioAffiliation,
  StudioArtistRow,
  StudioCnpjValidation,
  StudioComplianceView,
} from '@/lib/types/studio';
import { formatCNPJ, onlyDigits } from '@/lib/validation';

export const studioKeys = {
  all: ['studio'] as const,
  compliance: () => ['studio', 'compliance'] as const,
  affiliation: () => ['studio', 'affiliation'] as const,
};

/**
 * Mock stores do estúdio.
 *
 * O backend ainda não expõe a área do estúdio (`/api/studios/*`), então cada
 * read tenta a API e, em falha, cai nestes stores em memória. As mutations
 * tentam a rota real mas aplicam localmente para manter o dashboard navegável
 * em desenvolvimento. TODO(migracao): remover os stores quando a API chegar.
 */
let complianceStore: StudioComplianceView | null = null;
let affiliationStore: StudioAffiliation = {
  pedidos: studioPedidos,
  partners: studioPartners,
};

interface AffiliationsApiResponse {
  sucesso?: boolean;
  pedidos?: StudioAffiliation['pedidos'];
  partners?: StudioArtistRow[];
}

const MOCK_RAZAO_SOCIAL = 'Estúdio TattooGo LTDA';

/**
 * POST /api/studios/validate-cnpj -> confirma o CNPJ junto à Receita e devolve
 * a razão social + situação cadastral. Fallback local quando a rota ainda não
 * existe (ver TODO do módulo).
 */
export async function validateStudioCnpj(cnpj: string): Promise<StudioCnpjValidation> {
  const digits = onlyDigits(cnpj);
  const cnpjMasked = formatCNPJ(digits);

  try {
    const payload = await api.post<StudioCnpjValidation>(endpoints.studios.validateCnpj(), {
      cnpj: digits,
    });
    if (payload && typeof payload.razaoSocial === 'string') return payload;
  } catch {
    // Rota indisponível -> mock.
  }

  return {
    cnpj: digits,
    cnpjMasked,
    razaoSocial: MOCK_RAZAO_SOCIAL,
    status: 'ativa',
  };
}

/**
 * POST /api/studios/register -> registra o CNPJ validado como compliance do
 * estúdio e devolve a view consolidada. Persiste no `complianceStore` local.
 */
export async function registerStudio(cnpj: string): Promise<StudioComplianceView> {
  const digits = onlyDigits(cnpj);
  const cnpjMasked = formatCNPJ(digits);
  const validatedAt = new Date().toISOString();

  try {
    const payload = await api.post<StudioComplianceView>(endpoints.studios.register(), {
      cnpj: digits,
    });
    if (payload && typeof payload.cnpjMasked === 'string') {
      complianceStore = payload;
      return payload;
    }
  } catch {
    // Rota indisponível -> mock.
  }

  complianceStore = {
    cnpj: digits,
    cnpjMasked,
    razaoSocial: MOCK_RAZAO_SOCIAL,
    status: 'ativa',
    validatedAt,
  };
  return complianceStore;
}

/** GET /api/studios/compliance -> compliance atual, ou `null` se não registado. */
export async function fetchStudioCompliance(): Promise<StudioComplianceView | null> {
  try {
    const payload = await api.get<{ compliance?: StudioComplianceView | null }>(
      endpoints.studios.compliance(),
    );
    if (payload && 'compliance' in payload) {
      complianceStore = payload.compliance ?? null;
    }
  } catch {
    // Rota indisponível -> mock store.
  }
  return complianceStore;
}

/** GET /api/studios/affiliation -> pedidos pendentes + parceiros ativos. */
export async function fetchStudioAffiliation(): Promise<StudioAffiliation> {
  try {
    const payload = await api.get<AffiliationsApiResponse>(endpoints.studios.affiliation());
    if (payload && (payload.pedidos || payload.partners)) {
      affiliationStore = {
        pedidos: payload.pedidos ?? [],
        partners: payload.partners ?? [],
      };
    }
  } catch {
    // Rota indisponível -> mock store.
  }
  return affiliationStore;
}

/**
 * PATCH /api/studios/affiliation -> aceita/rejeita um pedido de afiliação.
 *
 * Em sucesso, um pedido aceito passa a integrar o roster (`partners`). Em falha
 * de rede, a aplicação é feita no store local para não travar o fluxo em dev.
 */
export async function respondToAffiliation(
  pedidoId: string,
  decision: PedidoDecision,
): Promise<StudioAffiliation> {
  const status: PedidoStatus = decision === 'aceitar' ? 'aceito' : 'rejeitado';

  try {
    await api.patch(endpoints.studios.affiliation(), { pedidoId, decision });
  } catch {
    // Rota indisponível -> aplica localmente.
  }

  const pedido = affiliationStore.pedidos.find((item) => item.id === pedidoId);
  if (!pedido) return affiliationStore;

  const alreadyPartner = affiliationStore.partners.some(
    (partner) => partner.id === pedido.artista.id,
  );

  affiliationStore = {
    pedidos: affiliationStore.pedidos.map((item) =>
      item.id === pedidoId ? { ...item, status } : item,
    ),
    partners:
      decision === 'aceitar' && !alreadyPartner
        ? [
            ...affiliationStore.partners,
            {
              id: pedido.artista.id,
              name: pedido.artista.name,
              avatarUrl: pedido.artista.avatarUrl,
              initial: pedido.artista.initial,
              styles: pedido.styles,
              status: 'ativo',
            },
          ]
        : affiliationStore.partners,
  };

  return affiliationStore;
}
