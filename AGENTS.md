# AGENTS.md

Clerk Skills is a collection of task-based guides and templates that help AI agents implement Clerk authentication. Skills include decision trees for routing, code templates, and common pitfall documentation.

## Directory Structure

```
skills/
├── .claude-plugin/
│   └── marketplace.json      # Plugin registry metadata
├── commands/
│   └── clerk.md              # /clerk slash command workflow
├── skills/
│   ├── SKILL.md              # Master skill with decision trees
│   ├── setup/                # Framework setup & basic auth
│   ├── customizing-auth-ui/  # Custom sign-in/up components
│   ├── managing-orgs/        # B2B multi-tenant organizations
│   ├── nextjs-patterns/      # Advanced Next.js patterns
│   ├── syncing-users/        # Webhook → database sync
│   └── testing-auth/         # E2E testing setup
└── README.md                 # User-facing documentation
```

## Skill Routing

The master `skills/SKILL.md` contains decision trees that route to the appropriate sub-skill:

```
User Request
    │
    ├─ "Add authentication" → setup/
    ├─ "Custom sign-in UI"  → customizing-auth-ui/
    ├─ "Organizations/RBAC" → managing-orgs/
    ├─ "Sync users to DB"   → syncing-users/
    ├─ "Write auth tests"   → testing-auth/
    └─ "Next.js patterns"   → nextjs-patterns/
```

### Skill Structure

Each skill follows this pattern:

```
skills/{skill-name}/
├── SKILL.md              # Main documentation (required)
├── templates/            # Code templates (optional)
│   ├── *.tsx/.ts
│   └── {framework}/      # Framework-specific folders
├── references/           # Deep-dive docs (optional)
└── scripts/              # Setup scripts (optional)
```

## Creating New Skills

### 1. SKILL.md Format

Every skill requires a `SKILL.md` with YAML frontmatter:

```yaml
---
name: skill-slug
description: One-line description of what this skill does
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---
```

### 2. Required Sections

Include these sections in every SKILL.md:

1. **Title & Overview** - What the skill does and when to use it
2. **Quick Start** - Table or list for rapid orientation
3. **Decision Tree** (if applicable) - ASCII flow chart for sub-routing
4. **Templates** - Table mapping templates to use cases
5. **Common Pitfalls** - Mistakes agents make and how to avoid them
6. **See Also** - Cross-references to related skills

### 3. Template Guidelines

Templates should be:
- **Self-contained** - Copyable without modification for basic use
- **Framework-specific** - Organize by framework (nextjs/, express/, etc.)
- **Named clearly** - Indicate use case (e.g., `sign-in-password.tsx`)
- **Commented** - Explain non-obvious patterns inline

### 4. Impact Levels

Use these levels to prioritize guidance:

| Level | Meaning | Example |
|-------|---------|---------|
| CRITICAL | Breaking bugs, security holes | "Always `await auth()`" |
| HIGH | Common mistakes | "Middleware matcher must include API routes" |
| MEDIUM | Optimizations | "Cache auth in layouts" |
| LOW | Nice-to-have | "Use `protect()` for cleaner code" |

## Key Patterns

### Server vs Client Authentication

```typescript
// Server Components (Next.js App Router)
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();  // MUST await

// Client Components
import { useAuth } from '@clerk/nextjs';
const { userId } = useAuth();  // Hook, no await
```

### Framework Detection

Check for these files to detect the framework:
- `next.config.js` or `next.config.mjs` → Next.js
- `remix.config.js` → Remix
- `vite.config.ts` with `@vitejs/plugin-react` → React SPA
- `express` in package.json → Express

### Common Pitfalls (All Skills)

1. **Missing `await` on `auth()`** - Server auth is async in Next.js 15+
2. **Wrong import path** - Use `@clerk/nextjs/server` for server code
3. **Middleware matcher** - Must include API routes: `matcher: ['/((?!.*\\..*|_next).*)', '/']`
4. **Environment variables** - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be public
5. **ClerkProvider missing** - Must wrap app in root layout

## Quality Checklist

Before submitting a new skill:

- [ ] SKILL.md has correct frontmatter (name, description, version)
- [ ] Decision tree routes to correct sub-tasks (if applicable)
- [ ] Templates are tested and working
- [ ] Common pitfalls section includes agent-specific mistakes
- [ ] Cross-references to related skills in "See Also"
- [ ] All code examples use current Clerk SDK patterns
- [ ] No hardcoded secrets or API keys in templates

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk SDK Reference](https://clerk.com/docs/references/nextjs/overview)
- [GitHub Issues](https://github.com/clerk/skills/issues) - Request new skills

When adding a new skill, update `.claude-plugin/marketplace.json` if it adds new keywords or categories.
