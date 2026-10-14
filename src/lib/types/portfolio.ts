import type {
  PortfolioBodyPart,
  PortfolioSessionDuration,
  PortfolioStyle,
} from '@/lib/portfolio-metadata';

/**
 * Contratos do Portfólio do tatuador (camada nativa).
 *
 * Espelha os tipos do web usados pelo `PortfolioUpload`:
 *  - `PortfolioWork`  -> item retornado por `GET /api/tatuador/portfolio`.
 *  - `PortfolioDraft` -> rascunho local produzido pelo formulário nativo, antes
 *    do upload para o S3 (via presigned URL).
 *  - `PortfolioCreateInput` -> payload persistido pelo backend depois do upload.
 *
 * Regra: os enums (`style`/`bodyPart`/`sessionDuration`) são a linguagem franca
 * com o backend e NUNCA devem ser traduzidos.
 */

export interface PortfolioWork {
  id: string;
  imageUrl: string;
  style: PortfolioStyle;
  bodyPart: PortfolioBodyPart;
  sessionDuration: PortfolioSessionDuration;
  isHealed: boolean;
  notes?: string | null;
  title?: string | null;
  createdAt?: string | null;
}

/** Payload enviado a `POST /api/upload/presign`. */
export interface PresignRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

/**
 * Resposta de `POST /api/upload/presign` (contrato web):
 * `{ presignedUrl, publicUrl }`. `key` é opcional (compatibilidade), mas a
 * `publicUrl` é obrigatória — é ela que vira a `imageUrl` do item no backend.
 */
export interface PresignResponse {
  presignedUrl: string;
  publicUrl: string;
  key?: string;
}

/** Rascunho local do formulário nativo (imagem escolhida + tags). */
export interface PortfolioDraft {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  width: number;
  height: number;
  style: PortfolioStyle | null;
  bodyPart: PortfolioBodyPart | null;
  sessionDuration: PortfolioSessionDuration | null;
  isHealed: boolean;
  notes: string;
}

/** Payload persistido após o upload do binário para o storage (`POST`). */
export interface PortfolioCreateInput {
  imageUrl: string;
  style: PortfolioStyle;
  bodyPart: PortfolioBodyPart;
  sessionDuration: PortfolioSessionDuration;
  isHealed: boolean;
  notes: string;
}

/**
 * Payload de curadoria (`PATCH /api/tatuador/portfolio/:id`).
 *
 * Mesmo corpo do `POST`, incluindo `imageUrl`: a edição reenvia a imagem atual
 * do item para manter a semântica de substituição total do endpoint.
 */
export type PortfolioUpdateInput = PortfolioCreateInput;
