import { ApiError } from './types';

/**
 * Central HTTP client for the future real backend. NOT used by any screen yet (every service is demo).
 * - Base URL comes from `VITE_API_URL` (public value, never put secrets in VITE_* variables).
 * - The access token is held in memory only, never in localStorage.
 */
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:3000/api';

let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export async function http<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init.method ?? 'GET',
      signal: init.signal,
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('network', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
    throw new ApiError(data?.code ?? `http_${res.status}`, data?.message ?? 'Có lỗi xảy ra. Thử lại sau.');
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
