'use client';

import { useSignIn } from '@clerk/nextjs';

export function OAuthButtons() {
  const { signIn, isLoaded } = useSignIn();

  async function handleOAuth(provider: 'oauth_google' | 'oauth_github') {
    if (!isLoaded) return;

    await signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  }

  return (
    <div className="space-y-2">
      <button onClick={() => handleOAuth('oauth_google')}>
        Continue with Google
      </button>
      <button onClick={() => handleOAuth('oauth_github')}>
        Continue with GitHub
      </button>
    </div>
  );
}

// SSO Callback Page (app/sso-callback/page.tsx)
// import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
// export default function SSOCallback() {
//   return <AuthenticateWithRedirectCallback />;
// }
