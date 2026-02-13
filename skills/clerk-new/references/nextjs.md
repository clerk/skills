# Next.js Project Setup

## Create Next App

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
> If `.` (cwd) is the chosen directory and files already exist, `create-next-app` will refuse to run. Work around this by generating into a `/tmp-app` directory, then moving all files back to cwd and deleting `/tmp-app` afterwards.

- Always pass `--disable-git` unless the user explicitly asks for git init.
- Always pass `--yes` to accept remaining defaults.

> If `npm` was not chosen as package manager, replace `npx` in the following command with `bunx --bun` or `<yarn|pnpm> dlx`

```bash
npx create-next-app@latest [directory] [options] --disable-git --yes
```

## Install Clerk
> If `npm` was not chosen as package manager, replace `npm install` in the following command with `<yarn|pnpm|bun> add`

```bash
npm install @clerk/nextjs @clerk/themes
```

## Add UI (optional)

Ask if shadcn should be added. If **no**, skip to the next step.

If **yes**, run through the selection prompt from [`shadcn`](shadcn) options.

> [!IMPORTANT]
> Set `template` to `next`. Use the same package manager executor as the `create-next-app` step — mismatched installers will fail.

From the project root, run:

> If `npm` was not chosen as package manager, replace `npx` in the following command with `bunx --bun` or `<yarn|pnpm> dlx`
```bash
npx shadcn@latest add dashboard-01
```

This creates a dashboard page and sidebar layout.

## Add Skills

Ask which agents the skills should be installed for by showing options from [`agents`](general#skills-agents).
- Allow multiple selections.
- Continue prompting until the user says `done` (max 10 agents).

Construct the command as follows (replacing `npx` if applicable):

```bash
npx skills add clerk/skills --yes \
  --skill "clerk" \
  --skill "clerk-setup" \
  --skill "clerk-nextjs-patterns" \
  --skill "clerk-custom-ui" \
  -a <agent1> -a <agent2>
```

Run from the project root.

## Add Clerk Features

Review `<project_cwd>/.agents/skills/clerk` for available Clerk skills. Follow the recommended skill for setting up basic auth in Next.js.

> [!IMPORTANT]
> Skip adding Clerk keys to `.env` — that's handled by the platform API in a later step.

- If `waitlist` was selected as template → use `<Waitlist />` component.
- Otherwise → use `<SignIn />` / `<SignUp />` components.

### Middleware

Add `clerkMiddleware` with public routes for `/`, `/api(.*)`, and all auth pages (including `/waitlist(.*)` if applicable).

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

Review the `clerk-custom-ui` skill in the project's skills directory for styling guidance. If shadcn is configured, follow its instructions to add the `shadcn` theme and any required shadcn components.

- Add a header component with sign-in/sign-up (or waitlist) buttons when signed out, and `<UserButton />` when signed in.
- Remove shadcn example components from `page.tsx` and `components/` — replace with the header and a clean landing page.
