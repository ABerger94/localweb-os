import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = 'dist';
const indexFile = join(distDir, 'index.html');

const routes = [
  'clients',
  'projects',
  'invoices',
  'retainers',
  'designer',
  'onboarding',
  'support',
  'qr-code',
  'auth-bridge',
  'client-portal',
  'client-portal/dashboard',
  'client-portal/projects',
  'client-portal/invoices',
  'client-portal/retainers',
  'client-portal/assets',
  'client-portal/support',
  'client-portal/onboarding',
];

await Promise.all(
  routes.map(async (route) => {
    const routeDir = join(distDir, ...route.split('/'));
    await mkdir(routeDir, { recursive: true });
    await copyFile(indexFile, join(routeDir, 'index.html'));
  })
);

console.log(`Generated SPA fallbacks for ${routes.length} routes.`);
