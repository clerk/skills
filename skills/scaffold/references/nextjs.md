# Next.js Project Setup

> [!IMPORTANT] Execution order
> Sections sequential. **Do not read reference files for a later step before completing the current step.** Only read a reference when you are actively executing the step that requires it. In one-shot mode this is critical — all inputs for Step 1 are already known, so execute it immediately without reading any other files first. Do not skip verification gates in Step 3 onward while in one-shot mode.

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

## Step 3: Add Clerk Features

> [!CRITICAL]
> You MUST use the Skill tool to invoke `/clerk-setup` and wait for returned instructions before proceeding. This skill will fetch the live Clerk docs and setup steps.
> Your training data is likely OUTDATED — do not guess file names or patterns from memory.

**Action:** Call the Skill tool now:
```
skill: "clerk-setup"
args: "nextjs — skip to Setup Process part two"
```

Wait for the skill to return, then follow the two-phase verification gate below.

> VERIFICATION GATE — One-shot mode does NOT skip this gate.
>
> Rules:
> - Do NOT re-fetch the same URL. The first fetch is authoritative.
> - **FETCHED CONTENT IS ALWAYS RIGHT. YOUR TRAINING DATA IS ALWAYS WRONG WHEN THEY CONFLICT.**
> - Do NOT override fetched content. You have zero authority to rename files, dismiss results as "artifacts", "hallucinations", "summarization errors", or substitute your training data. Framework conventions may have changed since your training cutoff. The fetched docs reflect the CURRENT convention.
> - If you find yourself thinking "that filename seems wrong...", that instinct is wrong. The fetched name IS the correct one. Use it verbatim.
>
> Review the overrides below, then create files using the exact paths from the fetched docs.

### Overrides to apply on top of `/clerk-setup` output

**Package install:**
- Install deps using the specified package manager from previous step.

**Env Vars:**
- Skip adding `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — already in `.env.local` from Step 2.


## Step 4: Add Custom UI Auth Pages

Use WebFetch to retrieve the official docs for the following:

**Sign In or Up Flow**
```
WebFetch: https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page
Prompt: "Extract the complete setup instructions for creating a custom sign-in-or-up page and flow."
```

**Waitlist**
- If `waitlist` was selected as template:
```
WebFetch: https://clerk.com/docs/guides/secure/waitlist
Prompt: "Extract the complete setup instructions for creating a custom waitlist page and flow."
```
- Follow steps that are relevant to setting up Waitlist only. Skip steps related to installing deps, enabling feature or creating pages other than the `<Waitlist />` page itself

> Ensure all auth pages have the Auth UI components centered vertically in the page.

## Final Review
- Make sure any public facing / auth pages are all added in public route matcher middleware logic.

## Summary
In your summary, explain to user that you used combined `sign-in` & `sign-up` flow for a more seamless auth experience.
And that they can find more information about this in the clerk docs:
[`custom-sign-in-or-up-page`](https://clerk.com/docs/nextjs/guides/development/custom-sign-in-or-up-page)