import { getAuthToken } from './auth/token';
import { apiBaseUrl } from './env';
import { getIntegrityToken } from './security/hardware-attestation';

export const API_BASE_URL = apiBaseUrl;

const DEFAULT_TIMEOUT_MS = 20000;

/** Header carrying the hardware-attestation token to the backend. */
export const APP_INTEGRITY_HEADER = 'X-App-Integrity-Token';

/**
 * Endpoints whose misuse (credential stuffing, fake account farms, forged KYC)
 * is the most damaging, so they are hardware-attested by default. The backend
 * verifies the token and decides whether to reject the request.
 */
const CRITICAL_PATH_PATTERNS: readonly RegExp[] = [
  /\/api\/kyc\b/i,
  /\/api\/auth\b/i,
  /\/api\/(login|sign-?in|signup|sign-?up|cadastro|registro)\b/i,
  /\/api\/studios\/(register|validate-cnpj)\b/i,
];

/** Whether a request must carry an attestation token. */
function requiresIntegrity(path: string, explicit: boolean | undefined): boolean {
  if (explicit !== undefined) return explicit;
  return CRITICAL_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
  timeoutMs?: number;
  /**
   * Force or suppress hardware attestation for this call. When omitted, the
   * endpoint is matched against `CRITICAL_PATH_PATTERNS` (login, sign-up, KYC,
   * studio registration, ...) to decide automatically.
   */
  attest?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    auth = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    attest,
    headers,
    ...rest
  } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Multipart payloads (video/photo evidence for KYC liveness) must keep the
  // boundary `fetch` computes itself, so we never set `Content-Type` for them.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : null),
    ...((headers as Record<string, string> | undefined) ?? null),
  };

  if (auth) {
    // Native auth is Clerk-only: the active session token is injected as a
    // Bearer header. No web cookies / credentials are ever sent.
    const token = await getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (requiresIntegrity(path, attest)) {
    // Hardware attestation is best-effort: when no token can be minted the
    // request still goes out, and the backend applies its own policy.
    const integrityToken = await getIntegrityToken({ scope: path, payload: body });
    if (integrityToken) finalHeaders[APP_INTEGRITY_HEADER] = integrityToken;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
      body:
        body !== undefined
          ? isFormData
            ? (body as FormData)
            : JSON.stringify(body)
          : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.status}`, response.status, payload);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') {
      throw new ApiError('Request timed out', 408, null);
    }
    throw new ApiError((error as Error).message ?? 'Network error', 0, null);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export const endpoints = {
  artistas: {
    byId: (id: string) => `/api/artistas/${encodeURIComponent(id)}`,
    get: (id: string) => `/api/artistas/${encodeURIComponent(id)}`,
    nearby: (lat?: number, lng?: number) =>
      lat !== undefined && lng !== undefined
        ? `/api/artistas/nearby?lat=${lat}&lng=${lng}`
        : '/api/artistas/nearby',
  },
  portfolio: {
    uploadValidated: () => '/api/portfolio/upload-validado',
  },
  feed: {
    list: () => '/api/feed',
  },
  search: {
    query: (q?: string) => (q ? `/api/search?q=${encodeURIComponent(q)}` : '/api/search'),
  },
  home: {
    feed: () => '/api/feed',
    search: (q?: string) => (q ? `/api/search?q=${encodeURIComponent(q)}` : '/api/search'),
    nearby: (lat?: number, lng?: number) =>
      lat !== undefined && lng !== undefined
        ? `/api/artistas/nearby?lat=${lat}&lng=${lng}`
        : '/api/artistas/nearby',
  },
  bookings: {
    create: () => '/api/agendamentos',
    list: () => '/api/agendamentos',
  },
  ai: {
    /** Consome o Gemini Flash no Next.js BFF (POST /api/chat). */
    chat: () => '/api/chat',
    generate: () => '/api/chat',
  },
  kyc: {
    submit: () => '/api/kyc',
    status: () => '/api/kyc/status',
    /** Multipart endpoint receiving the active-liveness video + live selfie. */
    liveness: () => '/api/kyc/liveness',
  },
  chat: {
    conversas: () => '/api/chat/conversas',
    historico: (conversaId?: string) =>
      conversaId ? `/api/chat/historico?conversaId=${encodeURIComponent(conversaId)}` : '/api/chat/historico',
    enviar: () => '/api/chat/enviar',
  },
  studios: {
    validateCnpj: () => '/api/studios/validate-cnpj',
    register: () => '/api/studios/register',
    compliance: () => '/api/studios/compliance',
    affiliation: () => '/api/studios/affiliation',
    /** Studio address/coordinates, carrying the `isMockedLocation` fraud flag. */
    location: () => '/api/studios/location',
  },
  media: {
    /**
     * Endpoint de mídia do BFF que retorna HTTP 302 Redirect para Cloudflare R2.
     * O expo-image segue o redirecionamento 302 automaticamente.
     */
    get: (keyOrId: string) => `/api/media/${encodeURIComponent(keyOrId)}`,
  },
} as const;

/**
 * Garante que URLs de mídia relativas do BFF/Backend sejam resolvidas com a URL base da API
 * para que o `expo-image` execute a requisição HTTP e siga os redirects 302 automaticamente
 * até as URLs pré-assinadas da Cloudflare R2.
 */
export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('file://') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
}
