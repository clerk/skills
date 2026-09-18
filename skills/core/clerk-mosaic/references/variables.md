# Design token variables

Every visual decision in Mosaic reads from a `--cl-*` custom property. The
stylesheet declares the defaults on `:root`; you override them the same way you
would any CSS variable. No rebuild, no prop.

```css
:root {
  --cl-color-primary: light-dark(#6c47ff, #a68cff);
  --cl-radius-md: 0.5rem;
  --cl-spacing: 0.25rem;
}
```

Start here for any request phrased as "match our brand", "our buttons are more
rounded", "tighter", "our font". One declaration reaches every component.

## Colors are `light-dark()` pairs

Each color token carries its light and dark value in one declaration:

```css
--cl-color-primary: light-dark(oklch(0.205 0 0), oklch(0.922 0 0));
```

Override with a `light-dark(<light>, <dark>)` pair so the token keeps responding
to the color scheme:

```css
:root {
  --cl-color-primary: light-dark(#6c47ff, #a68cff);
  --cl-color-primary-foreground: light-dark(white, #0a0a0a);
}
```

A flat value is legal but pins that color in both schemes:

```css
/* deliberate: this brand color is the same in light and dark */
--cl-color-primary: #6c47ff;
```

Only do that when you mean it. For anything that should adapt, keep the pair.

### Color tokens

Semantic families. Each has a base, a `-foreground` for text on top of it, and
most have a `-faded` for tinted backgrounds.

| Family | Tokens |
|---|---|
| Primary | `--cl-color-primary`, `--cl-color-primary-foreground`, `--cl-color-primary-faded` |
| Neutral | `--cl-color-neutral`, `--cl-color-neutral-foreground`, `--cl-color-neutral-faded` |
| Negative | `--cl-color-negative`, `--cl-color-negative-foreground`, `--cl-color-negative-faded` |
| Positive | `--cl-color-positive`, `--cl-color-positive-foreground`, `--cl-color-positive-faded` |
| Warning | `--cl-color-warning`, `--cl-color-warning-foreground`, `--cl-color-warning-faded` |
| Surface | `--cl-color-card`, `--cl-color-card-foreground` |
| Form | `--cl-color-input`, `--cl-color-input-placeholder` |
| Lines | `--cl-color-border`, `--cl-color-border-faded` |

`--cl-color-card` is the surface color for cards, menus, and popovers.
`--cl-color-card-foreground` is the text on them.

## Dark mode

Because every color token is a `light-dark()` pair, you do not write a second
set of colors. You flip `color-scheme` and the right branch resolves.

The default is `light dark`, so Mosaic follows the OS preference with no work.

To force a mode, set `color-scheme` on any ancestor:

```css
.root {
  color-scheme: dark;
}
```

With a class-based theme switcher:

```css
:root { color-scheme: light dark; }
.dark { color-scheme: dark; }
.light { color-scheme: light; }
```

To retint a token rather than pick a mode, override its whole pair:

```css
:root {
  --cl-color-primary: light-dark(#5b21b6, #c4b5fd);
}
```

## Radius

```css
--cl-radius-none: 0rem;
--cl-radius-sm:   0.25rem;
--cl-radius-md:   0.375rem;   /* the control radius: buttons, inputs, square avatars */
--cl-radius-lg:   0.5rem;     /* cards, menus, popovers */
--cl-radius-xl:   0.75rem;
--cl-radius-full: calc(infinity * 1px);
```

A plain size scale, so nesting a smaller step inside a larger one reads off the
name. `--cl-radius-md` is what most requests about "rounder buttons" mean.

```css
:root {
  --cl-radius-md: 0.75rem;
  --cl-radius-lg: 1rem;
}
```

## Spacing

`--cl-spacing` is the only spacing property exposed. Every gap, pad, and control
height derives from it, so overriding it rescales the whole UI's density at
once:

```css
:root {
  --cl-spacing: 0.2rem;   /* denser */
}
```

The individual steps are internal — there is no `--cl-spacing-4` to target. Set
the base, or fall back to a slot override for a single element's padding.

`--cl-target-coarse` (default `2.75rem`) is the floor a control's hit area drops
to under a coarse pointer. It is deliberately off the spacing scale so that
rescaling density cannot shrink a touch target. Leave it alone unless you have a
specific accessibility reason.

## Typography

Size and leading are separate variables per step:

```css
--cl-text-xs-size: 0.75rem;    --cl-text-xs-leading: calc(1 / 0.75);
--cl-text-sm-size: 0.875rem;   --cl-text-sm-leading: calc(1.25 / 0.875);
--cl-text-base-size: 1rem;     --cl-text-base-leading: calc(1.5 / 1);
--cl-text-lg-size: 1.125rem;   --cl-text-lg-leading: calc(1.75 / 1.125);
--cl-text-xl-size: 1.25rem;    --cl-text-xl-leading: calc(1.75 / 1.25);
--cl-text-2xl-size: 1.5rem;    --cl-text-2xl-leading: calc(2 / 1.5);
```

Weights:

```css
--cl-font-normal: 400;
--cl-font-medium: 500;
--cl-font-semibold: 600;
--cl-font-bold: 700;
```

Font family defaults to `inherit`, so Mosaic already picks up your app's font.
Override only to give Clerk a different one:

```css
:root {
  --cl-font-family-sans: 'Inter', sans-serif;
}
```

## Motion

```css
--cl-duration-instant: 0s;      /* contact: a press landing, a hover highlight */
--cl-duration-fast:    0.1s;    /* exits and short pointer-driven change */
--cl-duration-base:    0.15s;   /* that state decaying after the pointer leaves */
--cl-duration-slow:    0.25s;   /* panels, overlays */
--cl-duration-slower:  0.35s;

--cl-ease-default: cubic-bezier(0.175, 0.885, 0.32, 1.1);  /* things arriving */
--cl-ease-exit:    cubic-bezier(0.55, 0.085, 0.68, 0.53);  /* things leaving */
```

To cut animation globally, set the durations to `0s`. Prefer letting
`prefers-reduced-motion` do its job first.

## Scrollbars and edge fades

One opinion for every scrolling surface, applied only under `@media (pointer: fine)`.

```css
--cl-scrollbar-width: 8px;          /* set to 0px to hide the scrollbar */
--cl-scrollbar-thumb-inset: 2px;
--cl-scrollbar-thumb: …;            /* the base; the three below derive from it */
--cl-scrollbar-thumb-idle: …;       /* pointer elsewhere */
--cl-scrollbar-thumb-hover: …;
--cl-scrollbar-thumb-active: …;

--cl-scroll-fade-size:  1.5rem;
--cl-scroll-fade-range: 1.5rem;
```

The three state colors derive from `--cl-scrollbar-thumb` at use time, so
overriding the base re-derives all of them while each stays individually
overridable.

A scrollbar that fades in on approach:

```css
:root {
  --cl-scrollbar-thumb-idle: oklch(from var(--cl-scrollbar-thumb) l c h / 0);
}
```

## Scoping to a subtree

Tokens are ordinary custom properties, so setting one on a wrapper applies it to
everything inside and nothing outside:

```css
.checkout-flow {
  --cl-color-primary: light-dark(#0f9d58, #34d399);
  --cl-radius-md: 0.25rem;
}
```

```tsx
<div className='checkout-flow'>
  <UserButton />
</div>
```

Useful for a marketing page that themes Clerk differently from the app shell, or
for a single flow with its own accent.

## Mapping to an existing design system

Point Clerk's tokens at yours rather than duplicating values:

```css
:root {
  --cl-color-primary: var(--brand-500);
  --cl-color-primary-foreground: var(--brand-on-500);
  --cl-color-card: var(--surface-1);
  --cl-color-card-foreground: var(--text-1);
  --cl-color-border: var(--border-subtle);
  --cl-radius-md: var(--radius-control);
  --cl-radius-lg: var(--radius-surface);
  --cl-font-family-sans: var(--font-body);
}
```

If your system's variables are already per-scheme (a `.dark` class redefining
`--brand-500`), a flat `var()` is correct here — the branching happens in your
tokens, not Clerk's.
