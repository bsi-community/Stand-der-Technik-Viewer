/** Bounded requests and a small in-memory cache of public repository JSON only. */
const pending = new Map();
const documents = new Map();
const MAX_DOCUMENTS = 24;
export const REPOSITORY_TIMEOUT_MS = 8000;

export function fetchRepositoryJson(url, { retain = false } = {}) {
  if (retain && documents.has(url)) return Promise.resolve(documents.get(url));
  if (pending.has(url)) return pending.get(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPOSITORY_TIMEOUT_MS);
  const request = fetch(url, { credentials: 'omit', cache: 'no-store', signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then((json) => {
      if (retain) {
        documents.set(url, json);
        if (documents.size > MAX_DOCUMENTS) documents.delete(documents.keys().next().value);
      }
      return json;
    })
    .finally(() => {
      clearTimeout(timer);
      pending.delete(url);
    });
  pending.set(url, request);
  return request;
}
