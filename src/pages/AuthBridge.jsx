import { useEffect } from 'react';

export default function AuthBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('origin') || 'https://localweb-os.vercel.app';
    const target = params.get('target') || '/client-portal/dashboard';
    const accessToken = params.get('access_token');
    const isNewUser = params.get('is_new_user');

    const redirectUrl = new URL(target.startsWith('/') ? target : `/${target}`, origin);

    if (accessToken) {
      redirectUrl.searchParams.set('access_token', accessToken);
    }

    if (isNewUser != null) {
      redirectUrl.searchParams.set('is_new_user', isNewUser);
    }

    window.location.replace(redirectUrl.toString());
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}
