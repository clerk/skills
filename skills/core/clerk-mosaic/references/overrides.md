# Slot class overrides

When a token doesn't reach the exact element you want, target its slot class.

Every public element carries a stable `.cl-<slot>` class, and its visual props
are reflected as `data-<axis>` attributes on that same element. So you target an
element with a class and a variant with an attribute selector — no compound
class names to memorize.

```css
/* every button */
.cl-button {
  font-weight: 600;
}

/* only the filled primary variant */
.cl-button[data-variant='filled'][data-color='primary'] {
  background-image: linear-gradient(to bottom, #7c5cff, #6c47ff);
}

/* only the small size */
.cl-button[data-size='sm'] {
  letter-spacing: 0.01em;
}
```

Reach for this after tokens, not before. A token override survives internal
restructuring; a slot override is pinned to one element.

## Boolean variants are presence attributes

A boolean reflects only when true, as an empty-string attribute:

```css
.cl-button[data-full-width] { … }
.cl-button[data-disabled]   { … }
.cl-input[data-disabled]    { … }
```

Multi-word axes are kebab-cased: `fullWidth` → `data-full-width`.

## Slot catalog

| Slot | Element | Variant attributes |
|---|---|---|
| `.cl-button` | Button | `data-color` `primary｜neutral｜negative`, `data-variant` `filled｜outline｜ghost｜link`, `data-size` `sm｜md｜lg`, `data-shape` `default｜square｜circle`, `data-full-width`, `data-disabled` |
| `.cl-button-content` | Text run inside a button | — |
| `.cl-avatar` | Avatar root | `data-shape` `circle｜square`, `data-size` `fit｜xs｜sm｜md｜lg` |
| `.cl-avatar-image` | The `<img>` | — |
| `.cl-avatar-fallback` | Initials shown before/instead of the image | — |
| `.cl-badge` | Badge | `data-color` `primary｜neutral｜warning｜negative｜positive` |
| `.cl-card-root` | Card | `data-alignment` `start｜center`, `data-elevation` `card｜flush｜overlay` |
| `.cl-card-header` / `.cl-card-content` / `.cl-card-footer` | Card regions | — |
| `.cl-heading` | Heading | `data-size` `xs｜sm｜base｜lg｜xl｜2xl`, `data-color` `primary｜neutral｜warning｜negative｜positive` |
| `.cl-text` | Body copy | same axes as `.cl-heading` |
| `.cl-input` | Text input | `data-size` `sm｜md｜lg`, `data-disabled` |
| `.cl-icon` | Icon | `data-size` `sm｜md｜lg`, `data-placement` `inline-start｜inline-end` |
| `.cl-spinner` | Loading spinner | `data-size` `sm｜md` |
| `.cl-item` | List row | `data-size` `xs｜md`, `data-interactive` |
| `.cl-item-media` / `.cl-item-content` / `.cl-item-title` / `.cl-item-description` / `.cl-item-label` / `.cl-item-actions` | Row regions | — |
| `.cl-item-group` / `.cl-item-separator` | Row grouping | — |
| `.cl-menu-trigger` | The element that opens a menu | — |
| `.cl-menu-positioner` | Portalled wrapper that positions the menu | — |
| `.cl-menu-popup` | The menu surface | — |
| `.cl-menu-item` | A menu row | `data-color` `neutral｜negative` |
| `.cl-menu-separator` | Divider between menu groups | — |
| `.cl-popover-trigger` | The element that opens a popover | — |
| `.cl-popover-positioner` | Portalled wrapper that positions the popover | — |
| `.cl-popover-popup` | The popover surface | — |

Inspect the element in devtools to confirm its slot and the `data-*` attributes
actually present — a variant at its default value still reflects, a boolean at
`false` does not.

## Positioner vs popup

`-positioner` is the portalled, fixed-position wrapper. `-popup` is the visible
box inside it.

- Restyling the surface (background, radius, shadow, padding) → `-popup`.
- Anything about placement or stacking → usually not yours to set. Positioning is
  applied inline by the headless positioner, and the popup animates from
  `--cl-transform-origin`, which the positioner sets. Overriding `transform` or
  `inset` there fights the positioner.

```css
.cl-menu-popup {
  border-radius: 12px;
  box-shadow: 0 16px 32px -8px rgb(0 0 0 / 0.18);
}
```

If a popup is painting *behind* page content, that is a stacking problem, not a
styling one. See `setup.md` → "Isolate your app root". Adding `z-index` to the
positioner is the wrong fix.

## Interaction states

### Hover must be gated

Do not write a bare `.cl-button:hover`. Mosaic gates its own hover paints behind
`@media (hover: hover)` so they don't stick on touchscreens — on a phone,
`:hover` fires on tap and stays applied until you tap elsewhere. An ungated
override also outranks Mosaic's gated `:active`, so the press state stops
showing.

```css
@media (hover: hover) {
  .cl-button[data-variant='filled'][data-color='primary']:hover {
    background-color: #49247a;
  }
}
```

### Focus and active are not gated

Apply them directly.

```css
.cl-button:focus-visible {
  outline: 2px solid var(--cl-color-primary);
  outline-offset: 2px;
}

.cl-button:active {
  transform: translateY(1px);
}
```

Prefer `:focus-visible` over `:focus`. `:focus` fires on mouse clicks and taps
too, leaving a ring stuck on the button after a pointer interaction.
`:focus-visible` shows it only when the browser judges it useful — keyboard and
other non-pointer navigation — which is what Mosaic's own components do. Reserve
`:focus` for the rare case where you want a ring on every interaction.

Rule of thumb: `:hover` → wrap in `@media (hover: hover)`. Everything else →
apply directly.

## Scoping an override

Slot classes are global. Narrow with an ancestor when you want one instance
styled differently:

```css
.sidebar .cl-button[data-variant='ghost'] {
  justify-content: flex-start;
}
```

Often a scoped *token* is the better answer — it reaches every element in the
subtree instead of the one you named:

```css
.sidebar {
  --cl-color-primary: light-dark(#0f9d58, #34d399);
}
```

## Setting a variable on a slot

The two hooks compose. A `--cl-*` set on a slot class applies to that element
and its descendants, which is the cleanest way to retheme one component:

```css
.cl-menu-popup {
  --cl-color-card: light-dark(#fafafa, #171717);
  --cl-radius-md: 0.25rem;
}
```

Prefer this to redeclaring the popup's `background-color` — anything inside that
also reads `--cl-color-card` stays consistent.

## What is not a contract

- **The hashed `x1a2b3c…` classes.** StyleX internals. They change on every
  build. Never target them, never match on them, never mention them in a
  selector.
- **DOM structure.** Element nesting, wrappers, and which slot is a child of
  which can change. Prefer a direct `.cl-<slot>` selector over a descendant
  chain that encodes structure.
- **`@layer priority1 … priorityN`.** StyleX's internal precedence layers. Order
  Clerk's stylesheet with your own outer layer name at import instead — see
  `setup.md`.
- **`!important`.** Almost never needed. Unlayered CSS already beats Clerk's
  layered rules. If a rule isn't applying, the cause is usually layer order or a
  more specific Clerk selector, not weight.
