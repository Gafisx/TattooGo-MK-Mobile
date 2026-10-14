/**
 * Estúdio (role `estudio`) — contratos canônicos.
 *
 * Port dos tipos usados pelo dashboard do estúdio da Web: o painel de
 * compliance de CNPJ (`StudioComplianceView`), o roster de tatuadores
 * (`StudioArtistRow`) e os pedidos de afiliação (`Pedido`). A API devolve
 * exatamente estes shapes em `/api/studios/*`. Não invente campos.
 */

/** Situação cadastral do CNPJ devolvida pelo backend (fonte: Receita Federal). */
export type StudioComplianceStatus = 'ativa' | 'suspensa' | 'baixada' | 'pendente';

export interface StudioComplianceView {
  /** CNPJ sem máscara (14 dígitos). */
  cnpj: string;
  /** CNPJ formatado no padrão `00.000.000/0000-00`. */
  cnpjMasked: string;
  razaoSocial: string;
  status: StudioComplianceStatus;
  /** ISO da validação, ou `null` enquanto não confirmada. */
  validatedAt: string | null;
}

/** Resposta de `POST /api/studios/validate-cnpj`. */
export interface StudioCnpjValidation {
  cnpj: string;
  cnpjMasked: string;
  razaoSocial: string;
  status: StudioComplianceStatus;
}

export type StudioArtistStatus = 'ativo' | 'inativo';

/** Linha do roster de tatuadores afiliados ao estúdio. */
export interface StudioArtistRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  initial: string;
  /** Valores canônicos do enum `portfolio.style.*` (nunca traduzidos). */
  styles: string[];
  status: StudioArtistStatus;
}

export type PedidoStatus = 'pendente' | 'aceito' | 'rejeitado';

/** Ação disparada pelo estúdio sobre um pedido de afiliação. */
export type PedidoDecision = 'aceitar' | 'rejeitar';

/** Pedido de afiliação enviado por um tatuador ao estúdio. */
export interface Pedido {
  id: string;
  artista: {
    id: string;
    name: string;
    avatarUrl: string | null;
    initial: string;
  };
  /** Valores canônicos do enum `portfolio.style.*`. */
  styles: string[];
  status: PedidoStatus;
  createdAt: string;
}

/** Agregado devolvido por `GET /api/studios/affiliation`. */
export interface StudioAffiliation {
  pedidos: Pedido[];
  partners: StudioArtistRow[];
}
