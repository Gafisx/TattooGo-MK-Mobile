import { getAuthToken } from './auth/token';
import { apiBaseUrl } from './env';

export const API_BASE_URL = apiBaseUrl;

const DEFAULT_TIMEOUT_MS = 20000;

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
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : null),
    ...((headers as Record<string, string> | undefined) ?? null),
  };

  if (auth) {
    // Native auth is Clerk-only: the active session token is injected as a
    // Bearer header. No web cookies / credentials are ever sent.
    const token = await getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      signal: controller.signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
  portfolio: {
    list: (artistId: string) => `/api/portfolio/${artistId}`,
    uploadValidated: () => '/api/portfolio/upload-validado',
  },
  bookings: {
    create: () => '/api/agendamentos',
    list: () => '/api/agendamentos',
  },
  ai: {
    generate: () => '/api/ai/generate',
  },
  kyc: {
    submit: () => '/api/kyc',
    status: () => '/api/kyc/status',
  },
  chat: {
    threads: () => '/api/chat/threads',
    messages: (threadId: string) => `/api/chat/threads/${threadId}/messages`,
  },
  studios: {
    validateCnpj: () => '/api/studios/validate-cnpj',
    register: () => '/api/studios/register',
    compliance: () => '/api/studios/compliance',
    affiliation: () => '/api/studios/affiliation',
  },
} as const;
