# Custom Sign-Up Flow

Build a custom sign-up experience using the `useSignUp()` hook.

> **Core 2:** The `useSignUp()` hook returns a completely different shape in Core 2. If the project uses `@clerk/nextjs` v5–v6, `@clerk/clerk-react` v5–v6, or `@clerk/clerk-expo` v1–v2, see `core-2/custom-sign-up.md` instead. Key differences: returns `{ signUp, isLoaded, setActive }`, uses `create()` / `prepareVerification()` / `attemptVerification()` methods, and `setActive({ session: signUp.createdSessionId })` to finalize. Errors use try/catch with `isClerkAPIResponseError()`.

## Quick Reference: Core 2 → Current

| Core 2 | Current |
|--------|---------|
| `signUp.create({ emailAddress, password })` | `signUp.password({ emailAddress, password })` |
| `signUp.authenticateWithRedirect()` | `signUp.sso()` |
| `signUp.prepareVerification({ strategy: 'email_code' })` | `signUp.verifications.sendEmailCode()` |
| `signUp.attemptVerification({ strategy: 'email_code', code })` | `signUp.verifications.verifyEmailCode({ code })` |
| `signUp.prepareVerification({ strategy: 'phone_code' })` | `signUp.verifications.sendPhoneCode()` |
| `signUp.attemptVerification({ strategy: 'phone_code', code })` | `signUp.verifications.verifyPhoneCode({ code })` |
| `signUp.prepareVerification({ strategy: 'email_link' })` | `signUp.verifications.sendEmailLink()` |
| `setActive({ session: signUp.createdSessionId })` | `signUp.finalize({ navigate })` |
| try/catch with `isClerkAPIResponseError()` | `errors.fields`, `errors.global`, `errors.raw` |

## Hook API

```typescript
import { useSignUp } from '@clerk/nextjs' // or @clerk/react, @clerk/expo

const { signUp, errors, fetchStatus } = useSignUp()
```

| Property | Type | Description |
|----------|------|-------------|
| `signUp` | `SignUpFuture` | Sign-up object with namespaced methods |
| `errors` | `Errors<SignUpFields>` | Structured error object |
| `fetchStatus` | `'idle' \| 'fetching'` | Network request status |

## Sign-Up Methods

### Password (Email/Password)

```typescript
const { error } = await signUp.password({
  emailAddress: 'user@example.com',
  password: 'securePassword123',
  firstName: 'Jane',  // optional
  lastName: 'Doe',    // optional
})
```

### SSO (OAuth)

```typescript
const { error } = await signUp.sso({
  strategy: 'oauth_google', // or 'oauth_github', etc.
})
```

### Web3

```typescript
const { error } = await signUp.web3({ strategy: 'web3_solana_signature' })
```

### Update (add fields to existing sign-up)

```typescript
const { error } = await signUp.update({
  firstName: 'Jane',
  lastName: 'Doe',
})
```

### Upsert (create or update)

Conditionally creates a new sign-up or updates the existing one:

```typescript
const { error } = await signUp.upsert({
  emailAddress: 'user@example.com',
  password: 'securePassword123',
})
```

## Email / Phone Verification

After creating a sign-up, verify the user's email or phone:

### Email Code

```typescript
// Send verification code
const { error } = await signUp.verifications.sendEmailCode()

// Verify the code
const { error } = await signUp.verifications.verifyEmailCode({ code: '123456' })
```

### Phone Code

```typescript
// Send verification code
const { error } = await signUp.verifications.sendPhoneCode()

// Verify the code
const { error } = await signUp.verifications.verifyPhoneCode({ code: '123456' })
```

### Email Link

```typescript
const { error } = await signUp.verifications.sendEmailLink()
// User clicks the link in their email to verify
```

## Finalizing Sign-Up

After successful sign-up and verification, call `finalize()` to activate the session:

```typescript
await signUp.finalize({
  navigate: async ({ session, decorateUrl }) => {
    if (session?.currentTask) {
      const taskUrl = decorateUrl(`/sign-up/tasks/${session.currentTask}`)
      router.push(taskUrl)
      return
    }
    const url = decorateUrl('/')
    router.push(url)
  },
})
```

### Transferable Sign-Ups

If `signUp.isTransferable` is `true`, the identifier matches an existing user — transfer to sign-in instead:

```typescript
if (signUp.isTransferable) {
  // Redirect to sign-in page
  router.push('/sign-in')
  return
}
```

### Reset State

Clear local sign-up state and start over:

```typescript
signUp.reset()
```

## Error Handling

All methods return `Promise<{ error: ClerkError | null }>`. Errors are also available reactively on the hook:

```typescript
const { signUp, errors } = useSignUp()

// Field-level errors
errors?.fields?.emailAddress // { code, message, longMessage? }
errors?.fields?.password     // { code, message, longMessage? }
errors?.fields?.firstName    // { code, message, longMessage? }
errors?.fields?.lastName     // { code, message, longMessage? }
errors?.fields?.phoneNumber  // { code, message, longMessage? }
errors?.fields?.username     // { code, message, longMessage? }
errors?.fields?.code         // { code, message, longMessage? }

// Global errors
errors?.global // ClerkGlobalHookError[] | null

// Raw error array
errors?.raw // ClerkError[] | null
```

## Complete Example: Email/Password with Email Verification

```tsx
'use client'
import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'register' | 'verify'>('register')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signUp.password({
      emailAddress: email,
      password,
    })
    if (error) return

    // Send email verification code
    const { error: sendError } = await signUp.verifications.sendEmailCode()
    if (sendError) return

    setStep('verify')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await signUp.verifications.verifyEmailCode({ code })
    if (error) return

    await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          router.push(decorateUrl(`/sign-up/tasks/${session.currentTask}`))
          return
        }
        router.push(decorateUrl('/'))
      },
    })
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify}>
        <p>Check your email for a verification code.</p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification code"
        />
        {errors?.fields?.code && <p>{errors.fields.code.message}</p>}
        <button type="submit" disabled={fetchStatus === 'fetching'}>
          Verify Email
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRegister}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {errors?.fields?.emailAddress && <p>{errors.fields.emailAddress.message}</p>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {errors?.fields?.password && <p>{errors.fields.password.message}</p>}

      {errors?.global?.map((err, i) => <p key={i}>{err.message}</p>)}

      <button type="submit" disabled={fetchStatus === 'fetching'}>
        Sign Up
      </button>
    </form>
  )
}
```

## Docs

- [Custom sign-up flow](https://clerk.com/docs/custom-flows/overview)
- [useSignUp() reference](https://clerk.com/docs/references/react/use-sign-up)
