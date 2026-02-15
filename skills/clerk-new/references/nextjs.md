# Next.js Project Setup

> [!IMPORTANT] Execution order
> Sections and steps are sequential. **Do not read reference files for a later step before completing the current step.** Only read a reference when you are actively executing the step that requires it. In one-shot mode this is critical — all inputs for Step 1 are already known, so execute it immediately without reading any other files first.

## Step 1: Create Next App

### Collect options

Run `npx create-next-app@latest --help` to see all available options.

**Interactive mode** (not `one-shot`):
- Accept all defaults, or walk through options interactively.
- If `Context Arguments` already includes relevant CLI options, skip prompting for those — only ask for what's missing.
- Always prompt for:

| Option | Choices | Flag |
|--------|---------|------|
| Package manager | Bun, Pnpm, NPM | `--use-bun`, `--use-pnpm`, `--use-npm` |
| Linter | Biome, ESLint, None | `--biome`, `--eslint`, `--no-linter` |
| Src directory | Yes / No | `--src-dir` (if yes) |
| Project directory | `.` (cwd) or `<name>` | positional arg |

**One-shot mode:**
Use `--use-npm --no-linter` as defaults unless overridden by arguments.

### Run command

> [!WARNING]
> If `.` (cwd) is the chosen directory, use `tmp-app` (becomes a subdir of cwd) then moving all files back to cwd and deleting `tmp-app` afterwards (this prevents errors with nextjs cli).

- Always pass `--disable-git` unless the user explicitly asks for git init.
- Always pass `--yes` to accept remaining defaults.

> If `npm` was not chosen as package manager, replace `npx` in the following command with `bunx --bun` or `<yarn|pnpm> dlx`

```bash
npx create-next-app@latest [directory] [options] --disable-git --yes
```

## Step 2: Create Clerk App Intance
Follow all instructions in [`references/clerk-platform`](clerk-platform.md)

## Step 3: Install Clerk
> If `npm` was not chosen as package manager, replace `npm install` in the following command with `<yarn|pnpm|bun> add`

```bash
npm install @clerk/nextjs @clerk/themes
```

## Step 4: Add Clerk Features

Invoke `/clerk` skill to see available Clerk skills. Follow the recommended skill for setting up basic auth in Next.js.

> [!IMPORTANT]
> Add the proper env vars for custom auth pages. Skip adding Clerk tokens to `.env.local` if they already exist.

- If `waitlist` was selected as template → use `<Waitlist />` component.
- Otherwise → use `<SignIn />` / `<SignUp />` components.

### Middleware

Add `clerkMiddleware` with public routes for `/`, `/api(.*)`, and all auth pages (including `/waitlist(.*)` if applicable).

Example:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
```

> [!NOTE]
> Name the file `proxy.ts` (not `middleware.ts`) and place it at the project root, or at the root of `src/` if `--src-dir` was used.

### Custom UI

- Add a header component to `/page.tsx` with sign-in/sign-up (or waitlist) buttons when signed out, and `<UserButton />` when signed in.
