---
name: appearance
description: Customize Clerk component appearance with colors, borders, logos, and social button styles. Use when styling SignIn, SignUp, UserButton, or any Clerk component. Triggers on "appearance", "customize", "brand colors", "logo", "socialButtonsVariant", "theme".
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Appearance Customization

## Decision Tree

| Task | Documentation |
|------|---------------|
| Overview | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview |
| Layout options | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/layout |
| Variables (colors, fonts) | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables |
| Themes | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/themes |

## Critical Pattern

```typescript
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#0000ff',
      borderRadius: '0.5rem',
    },
    layout: {
      logoImageUrl: '/logo.png',
      socialButtonsVariant: 'iconButton',
    },
  }}
/>
```

## Key Properties

### variables (colors, typography, borders)

| Property | Description |
|----------|-------------|
| `colorPrimary` | Primary color throughout |
| `colorBackground` | Background color |
| `borderRadius` | Border radius (default: `0.375rem`) |

### layout (structure, logo, social buttons)

| Property | Description |
|----------|-------------|
| `logoImageUrl` | URL to custom logo |
| `socialButtonsVariant` | `'blockButton'` \| `'iconButton'` \| `'auto'` |
| `socialButtonsPlacement` | `'top'` \| `'bottom'` |

## Symptom-Based Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Colors not applying | Wrong property | Use `colorPrimary` not `primaryColor` |
| Logo not showing | Missing wrapper | Put `logoImageUrl` inside `layout: {}` |
| Social buttons wrong | Missing variant | Add `socialButtonsVariant: 'iconButton'` in `layout` |
| Catch-all 404 | Wrong folder | Use `[[...sign-in]]` folder naming |

## See Also

- [Appearance Prop Overview](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview)
- [Layout Options](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/layout)
- [Variables Reference](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables)
