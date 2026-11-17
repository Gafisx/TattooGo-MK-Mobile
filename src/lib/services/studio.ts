import { ApiError, api, endpoints } from '@/lib/api';
import type {
  PedidoDecision,
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
  search: (query?: string) => ['studio', 'search', query] as const,
};

interface AffiliationsApiResponse {
  sucesso?: boolean;
  pedidos?: StudioAffiliation['pedidos'];
  partners?: StudioArtistRow[];
}

export interface StudioSearchResult {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  rating?: number;
  avatarUrl?: string | null;
}

/**
 * POST /api/studios/validate-cnpj -> valida o CNPJ junto ao backend/Receita Federal
 * e retorna a razão social e situação cadastral oficial.
 */
export async function validateStudioCnpj(cnpj: string): Promise<StudioCnpjValidation> {
  const digits = onlyDigits(cnpj);
  const cnpjMasked = formatCNPJ(digits);

  const payload = await api.post<StudioCnpjValidation>(
    endpoints.studios.validateCnpj(),
    { cnpj: digits },
    { attest: true },
  );

  return {
    cnpj: payload.cnpj || digits,
    cnpjMasked: payload.cnpjMasked || cnpjMasked,
    razaoSocial: payload.razaoSocial,
    status: payload.status || 'ativa',
  };
}

/**
 * POST /api/studios/register -> registra o CNPJ validado como compliance do
 * estúdio no banco de dados e retorna a visão consolidada.
 */
export async function registerStudio(cnpj: string): Promise<StudioComplianceView> {
  const digits = onlyDigits(cnpj);
  const cnpjMasked = formatCNPJ(digits);

  const payload = await api.post<StudioComplianceView>(
    endpoints.studios.register(),
    { cnpj: digits },
    { attest: true },
  );

  return {
    cnpj: payload.cnpj || digits,
    cnpjMasked: payload.cnpjMasked || cnpjMasked,
    razaoSocial: payload.razaoSocial,
    status: payload.status || 'ativa',
    validatedAt: payload.validatedAt || new Date().toISOString(),
  };
}

/**
 * GET /api/studios/compliance -> obtém o compliance registrado do estúdio autenticado,
 * ou `null` caso ainda não possua registro.
 */
export async function fetchStudioCompliance(): Promise<StudioComplianceView | null> {
  try {
    const payload = await api.get<
      { compliance?: StudioComplianceView | null } | StudioComplianceView
    >(endpoints.studios.compliance());

    if (!payload) return null;
    if ('compliance' in payload) {
      return payload.compliance ?? null;
    }
    if ('cnpj' in payload && payload.cnpj) {
      return payload as StudioComplianceView;
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 204)) {
      return null;
    }
    throw error;
  }
}

/**
 * GET /api/studios/affiliation -> busca pedidos de afiliação e parceiros reais do estúdio.
 */
export async function fetchStudioAffiliation(): Promise<StudioAffiliation> {
  const payload = await api.get<AffiliationsApiResponse | StudioAffiliation>(
    endpoints.studios.affiliation(),
  );

  const pedidos =
    payload && 'pedidos' in payload && Array.isArray(payload.pedidos) ? payload.pedidos : [];
  const partners =
    payload && 'partners' in payload && Array.isArray(payload.partners) ? payload.partners : [];

  return { pedidos, partners };
}

/**
 * PATCH /api/studios/affiliation -> aceita ou rejeita um pedido de afiliação de tatuador.
 */
export async function respondToAffiliation(
  pedidoId: string,
  decision: PedidoDecision,
): Promise<StudioAffiliation> {
  const payload = await api.patch<AffiliationsApiResponse | StudioAffiliation>(
    endpoints.studios.affiliation(),
    { pedidoId, decision },
  );

  if (payload && ('pedidos' in payload || 'partners' in payload)) {
    return {
      pedidos: Array.isArray(payload.pedidos) ? payload.pedidos : [],
      partners: Array.isArray(payload.partners) ? payload.partners : [],
    };
  }

  return fetchStudioAffiliation();
}

/**
 * GET /api/studios/search -> busca e pesquisa de estúdios por termo e/ou geolocalização.
 */
export async function searchStudios(
  query?: string,
  coords?: { lat?: number; lng?: number },
): Promise<StudioSearchResult[]> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (coords?.lat !== undefined) params.set('lat', String(coords.lat));
  if (coords?.lng !== undefined) params.set('lng', String(coords.lng));

  const qs = params.toString();
  const path = qs ? `/api/studios/search?${qs}` : '/api/studios/search';

  const payload = await api.get<
    { studios?: StudioSearchResult[]; items?: StudioSearchResult[] } | StudioSearchResult[]
  >(path);

  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.studios)) return payload.studios;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}
