const BASE44_APP_BASE_URL = 'https://local-web-connect.base44.app';

export const redirectToClientLogin = (targetPath = '/client-portal/dashboard') => {
  const normalizedTarget = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;

  window.location.href = `${BASE44_APP_BASE_URL}/login?from_url=${encodeURIComponent(
    new URL(normalizedTarget, BASE44_APP_BASE_URL).toString()
  )}`;
};
