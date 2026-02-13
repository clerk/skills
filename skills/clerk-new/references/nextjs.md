# Next.js Project Setup Instructions

## Create Next App
### Collect options:
Run `npx create-next-app@latest --help`, to see available options.
- Ask if you should accept *all* defaults otherwise, walkthrough options interactively.
- If `Context Arguments` includes any relevant cli options, skip prompting for those and only ask for whats not included.

Always ask about:
- Package Manager: `Bun (--use-bun)`. `Pnpm (--use-pnpm)`, `NPM (--use-npm)`, 
- Linter: `Biome (--biome)`, `Eslint (--eslint)` or `None (--no-linter)`
- Using `src` dir:  `Yes/No` ->  (If yes, include `--src-dir`)
- Project directory: `cwd` (".") or a new directory `<name>`.

> Skip git initialization (`--disable-git`)  unless explicitly asked for.

### Run command:
Using the correct package manager command from [`commands`](general#package-manager-commands)
Run `<pm_x_cmd> create-next-app@latest [directory] [options] --yes`
> Always use `--yes` in command to accept additional defaults.

## Install Clerk
Run `<pm_add_cmd> @clerk/next @clerk/themes`


## Add UI (optional)
Ask if shadcn should be added to project. 

If no, proceed to next step.
If yes, run through selection prompt from options in [`shadcn`](shadcn). 
> Make sure `template` is set to `next`.

>[!IMPORTANT] Run command with same pkg manager in `create-next-app` step, otherwise install might fail. 

From inside of project `cwd`, run: 
> `<pm_x_cmd> shadcn@latest add dashboard-01`

A newly created dashboard page & sidebar should be available.

## Add Skills
Explain that you're about to supercharge the project with official Clerk skills.

Ask which agents the skills should be installed for (can select multiple) by showing options available at [`agents`](general#skills-agents). <br />(Continue prompting for selections until `done` is requested or up to 10 agents max).

*The command you will run should be constructed as follows*:

Base: `<pm_x_cmd> skills add clerk/skills  --yes`<br />
Skill options: `--skill "clerk" --skill "clerk-setup" --skill "clerk-nextjs-patterns" --skill "clerk-custom-ui"`<br /> 
Agent options: `-a <agent1> -a <agent2>` (repeat for as many agents selected)<br /> 

From the **cwd** of the newly created project, run `<base command> [options]`.


## Add Clerk features
Review `<project_cwd>/.claude/skills/clerk` for a directory of helpful clerk skills.
Navigate to recommended skills for setting up basic auth in nextjs.
> Skip adding Clerk keys to env vars. That's handled by `platform api` in another step

If '`waitlist` was selected as template, follow instructions for using `<Waitlist />`, otherwise use basic `SignIn` / `SignUp` components from Clerk.


### Add middleware
Follow instructions for adding `clerkMiddleware`.

Include `/` & `/api(.*)` and all necessary auth pages (including waitlist if applicable) as public routes using `createRouteMatcher` from `@clerk/nextjs/server`

Example:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/api(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})
```

> Rename `middleware.ts` to `proxy.ts` and place either under root of project (or at root of `src-dir` if src was used). 

### Custom UI
Review the `clerk-custom-ui` skill in the project `skills` directory for help with styling components.
If `shadcn` was configured in project, follow the instructions in this skill to add `shadcn` theme support and install any shadcn components needed to setup .


- Add a basic header component for homepage with sign-in/sign-up or waitlist buttons (if signed out) or UserButton (if signed in)
- Remove shadcn example components from `/page.tsx` and `components/*` and add header and basic UI to `page.tsx`
