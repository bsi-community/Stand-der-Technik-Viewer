/**
 * Runs inline before the asset imports, so even cached HTML whose old assets have
 * been removed can recover. Keep this function self-contained for the build plugin.
 * Check only at startup: never reload a session containing locally uploaded files.
 */
export async function prepareViewer(buildId, basePath) {
  const currentUrl = new URL(window.location.href);
  const attempt = currentUrl.searchParams.get('_viewer_release');
  const isBuildId = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (isBuildId(attempt)) {
    currentUrl.searchParams.delete('_viewer_release');
    window.history.replaceState(window.history.state, '', currentUrl);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const manifestUrl = new URL(basePath + 'release.json', window.location.origin);
    // Bypass both the browser's ten-minute Pages cache and intermediary caches.
    manifestUrl.searchParams.set('check', Date.now().toString());
    const response = await fetch(manifestUrl, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
    if (!response.ok) return true;
    const release = await response.json();
    if (!isBuildId(release?.buildId) || release.buildId === buildId) return true;
    // A temporarily inconsistent deployment must not cause a navigation loop.
    if (isBuildId(attempt)) return true;
    currentUrl.searchParams.set('_viewer_release', release.buildId);
    window.location.replace(currentUrl.href);
    return false;
  } catch (_error) {
    // Local documents remain usable when the update endpoint is unavailable.
    return true;
  } finally {
    clearTimeout(timeout);
  }
}
