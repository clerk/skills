# Custom Sign-In Flow

Build a custom sign-in experience using the `useSignIn()` hook.

## Hook API

```typescript
import { useSignIn } from '@clerk/nextjs' // or @clerk/react, @clerk/expo

const { signIn, errors, fetchStatus } = useSignIn()
```

| Property | Type | Description |
|----------|------|-------------|
| `signIn` | `SignInFuture` | Sign-in object with namespaced methods |
| `errors` | `Errors<SignInFields>` | Structured error object |
| `fetchStatus` | `'idle' \| 'fetching'` | Network request status |

## Sign-In Methods

### Password

```typescript
const { error } = await signIn.password({
  identifier: 'user@example.com',
  password: 'securePassword123',
})
```

### SSO (OAuth / Enterprise)

```typescript
const { error } = await signIn.sso({
  strategy: 'oauth_google', // or 'oauth_github', 'enterprise_sso', etc.
})
```

### Passkey

```typescript
const { error } = await signIn.passkey({ flow: 'discoverable' })
```

### Web3

```typescript
const { error } = await signIn.web3({ strategy: 'web3_solana_signature' })
// or
const { error } = await signIn.web3({ strategy: 'web3_base_signature' })
```

### Ticket (Invitation link)

```typescript
const { error } = await signIn.ticket({ ticket: 'ticket_abc123' })
```

### Email Code

```typescript
// Send code (emailAddress is optional if a signIn already exists from a prior method call)
const { error } = await signIn.emailCode.sendCode({ emailAddress: 'user@example.com' })

// Verify code
const { error } = await signIn.emailCode.verifyCode({ code: '123456' })
```

### Phone Code

```typescript
// Send code (phoneNumber is optional if a signIn already exists from a prior method call)
const { error } = await signIn.phoneCode.sendCode({ phoneNumber: '+12015551234' })

// Verify code
const { error } = await signIn.phoneCode.verifyCode({ code: '123456' })
```

## MFA (Second Factor)

A second factor is required when `signIn.status` is one of:
- `'needs_second_factor'` — user has MFA enabled (TOTP, backup codes, etc.)
- `'needs_client_trust'` — new device sign-in without MFA; requires email or phone code verification

```typescript
// TOTP (Authenticator app)
const { error } = await signIn.mfa.verifyTOTP({ code: '123456' })

// Backup code
const { error } = await signIn.mfa.verifyBackupCode({ code: 'backup-code-here' })

// Email code
const { error: sendErr } = await signIn.mfa.sendEmailCode()
const { error: verifyErr } = await signIn.mfa.verifyEmailCode({ code: '123456' })

// Phone code
const { error: sendErr } = await signIn.mfa.sendPhoneCode()
const { error: verifyErr } = await signIn.mfa.verifyPhoneCode({ code: '123456' })
```

## Password Reset

```typescript
// 1. Send reset code
const { error } = await signIn.resetPasswordEmailCode.sendCode()

// 2. Verify the code
const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: '123456' })

// 3. Submit new password
const { error } = await signIn.resetPasswordEmailCode.submitPassword({
  password: 'newSecurePassword123',
})
```

## Client Trust

When a user signs in with a valid password from a new device without MFA enabled, the sign-in status becomes `needs_client_trust`. This requires an additional verification step:

```typescript
if (signIn.status === 'needs_client_trust') {
  // Check supportedSecondFactors for available methods (email_code or phone_code)
  const factors = signIn.supportedSecondFactors
  // Use the appropriate mfa method to verify
}
```

## Finalizing Sign-In

After successful authentication, call `finalize()` to activate the session:

```typescript
await signIn.finalize({
  navigate: async ({ session, decorateUrl }) => {
    // Check for session tasks (e.g., forced password reset, MFA setup)
    if (session?.currentTask) {
      const taskUrl = decorateUrl(`/sign-in/tasks/${session.currentTask}`)
      router.push(taskUrl)
      return
    }
    const url = decorateUrl('/')
    router.push(url)
  },
})
```

- `decorateUrl(path)` — decorates the URL with session info (required to support Safari's Intelligent Tracking Prevention). May return an absolute URL.
- `session.currentTask` — check for pending session tasks before redirecting

### Reset State

Clear local sign-in state and start over:

```typescript
signIn.reset()
```

## Error Handling

All methods return `Promise<{ error: ClerkError | null }>`. Errors are also available reactively on the hook:

```typescript
const { signIn, errors } = useSignIn()

// Field-level errors
errors?.fields?.identifier // { code, message, longMessage? }
errors?.fields?.password   // { code, message, longMessage? }
errors?.fields?.code       // { code, message, longMessage? }

// Global errors (not tied to a field)
errors?.global // ClerkGlobalHookError[] | null

// Raw error array
errors?.raw // ClerkError[] | null
```

## Complete Example: Email/Password with MFA

```tsx
'use client'
import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn.password({ identifier, password })

    if (error) return // errors are available via `errors` object

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      setStep('mfa')
      return
    }

    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          router.push(decorateUrl(`/sign-in/tasks/${session.currentTask}`))
          return
        }
        router.push(decorateUrl('/'))
      },
    })
  }

  async function handleMFA(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signIn.mfa.verifyTOTP({ code: mfaCode })
    if (error) return

    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          router.push(decorateUrl(`/sign-in/tasks/${session.currentTask}`))
          return
        }
        router.push(decorateUrl('/'))
      },
    })
  }

  if (step === 'mfa') {
    return (
      <form onSubmit={handleMFA}>
        <input
          type="text"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          placeholder="Enter MFA code"
        />
        {errors?.fields?.code && <p>{errors.fields.code.message}</p>}
        <button type="submit" disabled={fetchStatus === 'fetching'}>
          Verify
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Email"
      />
      {errors?.fields?.identifier && <p>{errors.fields.identifier.message}</p>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {errors?.fields?.password && <p>{errors.fields.password.message}</p>}

      {errors?.global?.map((err, i) => <p key={i}>{err.message}</p>)}

      <button type="submit" disabled={fetchStatus === 'fetching'}>
        Sign In
      </button>
    </form>
  )
}
```

## Docs

- [Custom sign-in flow](https://clerk.com/docs/custom-flows/overview)
- [useSignIn() reference](https://clerk.com/docs/references/react/use-sign-in)
