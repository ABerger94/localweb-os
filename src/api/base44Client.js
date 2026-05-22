import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// Suppress analytics logging 403 errors for client portal users
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0] || '';
    if (typeof url === 'string' && url.includes('/api/app-logs/') && url.includes('/log-user-in-app/')) {
      return originalFetch.apply(this, args).catch(() => {
        // Silently ignore analytics logging errors
      });
    }
    return originalFetch.apply(this, args);
  };
}