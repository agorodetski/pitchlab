/**
 * Thrown when a request takes longer than its time limit.
 */
export class RequestTimeoutError extends Error {
  constructor(message = 'The request timed out. Please check your connection and try again.') {
    super(message);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * POST JSON and parse the JSON reply, giving up after `timeoutMs` so the UI never
 * stays on a loading screen forever (slow server start, dropped mobile connection,
 * or a stalled AI call).
 */
export async function postJsonWithTimeout<T = any>(
  url: string,
  body: unknown,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    try {
      return (await res.json()) as T;
    } catch (parseErr: any) {
      if (parseErr?.name === 'AbortError') throw parseErr;
      throw new Error(`The server returned an unexpected response (${res.status}). Please try again.`);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new RequestTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
