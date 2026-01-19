'use client';

import { useSignIn } from '@clerk/nextjs';

export function OAuthButtons() {
  const { signIn } = useSignIn();

  const signInWith = (strategy: 'oauth_google' | 'oauth_github') => {
    signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => signInWith('oauth_google')}
        className="flex items-center justify-center gap-2 px-4 py-2 border rounded"
      >
        Continue with Google
      </button>
      <button
        onClick={() => signInWith('oauth_github')}
        className="flex items-center justify-center gap-2 px-4 py-2 border rounded"
      >
        Continue with GitHub
      </button>
    </div>
  );
}

// SSO Callback page (app/sso-callback/page.tsx):
// import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
// export default function SSOCallback() {
//   return <AuthenticateWithRedirectCallback />;
// }
