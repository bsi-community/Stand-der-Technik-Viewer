import { afterEach, test, expect, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function fresh() {
  vi.resetModules();
  return import('../../src/infrastructure/repository-fetch.js');
}

test('concurrent consumers share a request and retained public JSON avoids a second download', async () => {
  const body = { catalog: { metadata: { title: 'Test' } } };
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
  vi.stubGlobal('fetch', fetch);
  const { fetchRepositoryJson } = await fresh();
  const a = fetchRepositoryJson('https://example.org/public.json', { retain: true });
  const b = fetchRepositoryJson('https://example.org/public.json', { retain: true });
  expect(a).toBe(b);
  await expect(a).resolves.toBe(body);
  await expect(
    fetchRepositoryJson('https://example.org/public.json', { retain: true }),
  ).resolves.toBe(body);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: 'omit', cache: 'no-store' });
});

test('failed requests are not retained and a subsequent request can recover', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ catalog: {} }) });
  vi.stubGlobal('fetch', fetch);
  const { fetchRepositoryJson } = await fresh();
  await expect(
    fetchRepositoryJson('https://example.org/public.json', { retain: true }),
  ).rejects.toThrow('HTTP 503');
  await expect(
    fetchRepositoryJson('https://example.org/public.json', { retain: true }),
  ).resolves.toEqual({ catalog: {} });
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('a stalled repository request aborts at the bounded timeout', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    ),
  );
  const { fetchRepositoryJson, REPOSITORY_TIMEOUT_MS } = await fresh();
  const request = fetchRepositoryJson('https://example.org/public.json');
  const check = expect(request).rejects.toThrow('aborted');
  await vi.advanceTimersByTimeAsync(REPOSITORY_TIMEOUT_MS);
  await check;
  expect(vi.getTimerCount()).toBe(0);
});
