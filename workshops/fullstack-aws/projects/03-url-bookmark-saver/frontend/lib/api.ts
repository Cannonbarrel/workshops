import type { Bookmark } from '@/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Friendly messages for common failure modes
function friendlyError(err: unknown, status?: number): Error {
  if (status === 0 || err instanceof TypeError) {
    return new Error('Cannot reach the API. Check your connection or redeploy the backend.');
  }
  if (status === 503 || status === 502) {
    return new Error('API is temporarily unavailable. Please try again in a moment.');
  }
  if (err instanceof Error) return err;
  return new Error('Something went wrong. Please try again.');
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10s timeout

  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeout);

    // Try to parse JSON even on error responses
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) throw friendlyError(null, res.status);
      throw new Error(`Unexpected response from API (${res.status})`);
    }

    if (!res.ok) {
      const msg = (data as { error?: string })?.error || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeout);

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. The API may be starting up — try again in a moment.');
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error('Cannot reach the API. Verify the backend is deployed and CORS is enabled.');
    }
    throw friendlyError(err);
  }
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const data = await request<{ bookmarks: Bookmark[] }>('/bookmarks');
  return data.bookmarks ?? [];
}

export async function createBookmark(title: string, url: string): Promise<Bookmark> {
  const data = await request<{ bookmark: Bookmark }>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ title, url }),
  });
  return data.bookmark;
}

export async function deleteBookmark(id: string): Promise<void> {
  await request(`/bookmarks/${id}`, { method: 'DELETE' });
}
