---
name: clerk-mosaic
description: Style Clerk's Mosaic components (experimental) from your own CSS - design
  token variables, slot classes, cascade layers, dark mode. Use when restyling,
  rebranding, or theming Mosaic components to match a design system - colors, radius,
  spacing, fonts, hover and focus states, or targeting one specific element.
license: MIT
compatibility: Experimental. Requires `@clerk/nextjs`, `@clerk/react`, or `@clerk/ui` with the `experimental/mosaic` subpath. The surface changes without a major version while experimental.
metadata:
  author: clerk
  version: 0.1.0
---

# Mosaic

Mosaic components mount directly in your React tree (not in a clerk-js iframe or
managed root) and ship as a static stylesheet. You style them from your own CSS.
There is no styling prop and no build step.

```tsx
import { UserButton } from '@clerk/nextjs/experimental/mosaic';
```

```css
@import '@clerk/nextjs/experimental/mosaic/styles.css' layer(clerk);
```

> Experimental. Components and the styling surface change without a major version.

## The contract

Three hooks are public. Nothing else about the DOM is stable.

| Hook | What it is | Use it for |
|---|---|---|
| `--cl-*` variables | Design tokens on `:root` | Color, radius, spacing, type, motion across everything |
| `.cl-<slot>` classes | One stable class per public element | One specific element |
| `data-<axis>` attributes | Variant reflection on that element | One specific variant of that element |

```css
/* token: every button, badge, and link at once */
:root { --cl-color-primary: light-dark(#6c47ff, #a68cff); }

/* slot + variant: only filled primary buttons */
.cl-button[data-variant='filled'][data-color='primary'] { font-weight: 600; }
```

The hashed `x1a2b3c…` classes next to the `.cl-*` one are StyleX internals. Never
target them.

## Which hook

- Brand color, radius, spacing, or font across the UI → **token**. Start here.
  One line covers most requests. See `references/variables.md`.
- Dark mode → flip `color-scheme`, don't re-declare colors. See
  `references/variables.md`.
- A token doesn't reach the exact element or variant → **slot class**, narrowed
  with a `data-*` attribute. See `references/overrides.md`.
- Hover, focus, active → slot class, but match Clerk's own gating. See
  `references/overrides.md`.

## References

- `references/setup.md` — the stylesheet import, cascade layers and precedence,
  isolating your app root so popups paint correctly.
- `references/variables.md` — the `--cl-*` token catalog, `light-dark()` colors,
  dark mode, the spacing scale, scoping tokens to a subtree.
- `references/overrides.md` — slot classes, the `data-<axis>` catalog per
  component, interaction states, what is not a contract.

## Rules

- Style in CSS. There is no `appearance` or styling prop on Mosaic components —
  never introduce one to answer a styling request.
- Prefer a token override to a slot override when both work. It is more durable
  and covers more surface.
- Target only `.cl-*` classes and their `data-*` attributes.
- Override a color token with a `light-dark(<light>, <dark>)` pair, not a flat
  color, unless you deliberately want one color in both schemes.
- Wrap `:hover` in `@media (hover: hover)`. Apply `:focus-visible` and `:active`
  directly.
