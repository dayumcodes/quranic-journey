import { useAuthStore } from "@/lib/store/authStore";
import type { ApiError } from "@/types";

export class RequestError extends Error implements ApiError {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { accessToken, logout } = useAuthStore.getState();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const run = async () =>
    fetch(endpoint, {
      ...options,
      headers
    });
  let res = await run();
  if (res.status === 401) {
    res = await run();
    if (res.status === 401) logout();
  }
  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message ?? message;
    } catch {}
    throw new RequestError(res.status, message);
  }
  return (await res.json()) as T;
}
