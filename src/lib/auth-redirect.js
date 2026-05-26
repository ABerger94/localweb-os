const BASE44_APP_BASE_URL = 'https://local-web-connect.base44.app';

export const redirectToClientLogin = (targetPath = '/client-portal/dashboard') => {
  const normalizedTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;

  if (window.location.hostname.endsWith('base44.app')) {
    window.location.href = `${BASE44_APP_BASE_URL}/login?from_url=${encodeURIComponent(
      new URL(normalizedTarget, window.location.origin).toString()
    )}`;
    return;
  }

  const bridgeUrl = new URL('/auth-bridge', BASE44_APP_BASE_URL);
  bridgeUrl.searchParams.set('origin', window.location.origin);
  bridgeUrl.searchParams.set('target', normalizedTarget);

  window.location.href = `${BASE44_APP_BASE_URL}/login?from_url=${encodeURIComponent(
    bridgeUrl.toString()
  )}`;
};
