import { ApiError, api } from '@/lib/api';
import {
  isPortfolioBodyPart,
  isPortfolioSessionDuration,
  isPortfolioStyle,
} from '@/lib/portfolio-metadata';
import type {
  PortfolioCreateInput,
  PortfolioWork,
  PresignRequest,
  PresignResponse,
} from '@/lib/types/portfolio';

/**
 * Portfólio do tatuador — camada de serviço nativa.
 *
 * Contratos (espelham o web):
 *  - `GET  /api/tatuador/portfolio`        -> `{ sucesso, items }`
 *  - `POST /api/upload/presign`            -> `{ uploadUrl, key, publicUrl? }`
 *  - `PUT  <uploadUrl>` (S3)               -> binário da imagem
 *  - `POST /api/tatuador/portfolio`        -> cria o item já com `imageUrl`
 */

export const portfolioKeys = {
  all: ['tatuador', 'portfolio'] as const,
};

interface PortfolioListResponse {
  sucesso?: boolean;
  items?: unknown;
  erro?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

/**
 * Normaliza um item cru do backend. Retorna `null` quando o registro não tem a
 * forma mínima esperada — itens inválidos são descartados em vez de quebrarem
 * a tela (mesmo contrato tolerante da Galeria).
 */
export function parsePortfolioWork(value: unknown): PortfolioWork | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asString(record.id);
  const imageUrl =
    asString(record.imageUrl) ?? asString(record.image_url) ?? asString(record.image);
  const style = asString(record.style);
  const bodyPart = asString(record.bodyPart) ?? asString(record.body_part);
  const sessionDuration =
    asString(record.sessionDuration) ?? asString(record.session_duration);

  if (!id || !imageUrl || !style || !bodyPart || !sessionDuration) return null;
  if (!isPortfolioStyle(style) || !isPortfolioBodyPart(bodyPart)) return null;
  if (!isPortfolioSessionDuration(sessionDuration)) return null;

  return {
    id,
    imageUrl,
    style,
    bodyPart,
    sessionDuration,
    isHealed:
      asBoolean(record.isHealed) ||
      asBoolean(record.is_healed) ||
      asBoolean(record.healed),
    title: asString(record.title),
    createdAt: asString(record.createdAt) ?? asString(record.created_at),
  };
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

/** `GET /api/tatuador/portfolio` -> lista do tatuador autenticado. */
export async function fetchMyPortfolio(): Promise<PortfolioWork[]> {
  const payload = await api.get<PortfolioListResponse>('/api/tatuador/portfolio');
  if (payload.sucesso === false) {
    throw new ApiError(payload.erro ?? 'portfolio.upload.loadError', 400, payload);
  }
  return Array.isArray(payload.items) ? payload.items.map(parsePortfolioWork).filter(isPresent) : [];
}

/** `POST /api/upload/presign` -> URL assinada + chave do objeto no storage. */
export async function requestUploadPresign(input: PresignRequest): Promise<PresignResponse> {
  const payload = await api.post<Record<string, unknown>>('/api/upload/presign', input);
  const uploadUrl = asString(payload.uploadUrl) ?? asString(payload.upload_url);
  const key = asString(payload.key);
  if (!uploadUrl || !key) {
    throw new ApiError('portfolio.upload.presignError', 500, payload);
  }
  return {
    uploadUrl,
    key,
    publicUrl: asString(payload.publicUrl) ?? asString(payload.public_url) ?? undefined,
  };
}

/**
 * Envia o binário para a URL assinada.
 *
 * No web existia `input[type=file]` + `Blob`; no RN lemos o arquivo local via
 * `fetch(uri)` e fazemos `PUT` direto no S3 com o `Content-Type` da mídia.
 */
export async function uploadImageToStorage(
  uploadUrl: string,
  uri: string,
  contentType: string,
): Promise<void> {
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new ApiError('portfolio.upload.uploadError', uploadResponse.status, null);
  }
}

/** `POST /api/tatuador/portfolio` -> persiste o item com a `imageUrl` final. */
export async function createPortfolioWork(
  input: PortfolioCreateInput,
): Promise<PortfolioWork | null> {
  const payload = await api.post<Record<string, unknown>>('/api/tatuador/portfolio', input);
  return parsePortfolioWork(payload.item ?? payload.work ?? payload);
}
