# Setup

Three things: import the stylesheet, decide where it sits in your cascade, and
give your app root its own stacking context.

## Import the stylesheet

Mosaic components carry no runtime style injection. The stylesheet holds the
token defaults and every component rule, so nothing renders correctly without
it. Import it once, at your app's CSS entry point.

Match the subpath to the package you import components from:

```css
@import '@clerk/nextjs/experimental/mosaic/styles.css';
@import '@clerk/react/experimental/mosaic/styles.css';
@import '@clerk/ui/experimental/mosaic/styles.css';
```

A JS import works too, where your bundler supports it:

```ts
import '@clerk/nextjs/experimental/mosaic/styles.css';
```

Prefer the CSS `@import`. It is the only form that can name a cascade layer.

## Cascade layers

Mosaic's internal precedence already lives in layers — StyleX emits
`@layer priority1 … priorityN` for its own atom ordering. Those are internal.
What you control is the *outer* layer the whole stylesheet lands in, named at
import:

```css
@import '@clerk/nextjs/experimental/mosaic/styles.css' layer(clerk);
```

Layered styles lose to unlayered ones, so any rule in a plain stylesheet already
beats Clerk. You rarely need to think about specificity.

To order Clerk against other layers, declare the order first. Later layers win:

```css
@layer clerk, components, utilities;

@import '@clerk/nextjs/experimental/mosaic/styles.css' layer(clerk);
```

Now `components` and `utilities` override Clerk, and unlayered rules still beat
all three.

### With Tailwind

Tailwind v4 declares its own layers. Put Clerk before `utilities` so utility
classes on a Mosaic component win:

```css
@layer clerk;
@import '@clerk/nextjs/experimental/mosaic/styles.css' layer(clerk);
@import 'tailwindcss';
```

Importing without a layer also works — Clerk's rules are then unlayered and
outrank Tailwind's utilities, which is usually not what you want.

## Isolate your app root

Popups (the UserButton menu, popovers) portal to `document.body` and set no
`z-index` of their own. They rely on being late in DOM order and fixed
positioned, which is enough until a page element creates a high stacking
context and paints over them.

Give your app's root element its own stacking context so your page's `z-index`
values are contained and can't reach past it:

```css
.root {
  isolation: isolate;
}
```

`isolation: isolate` creates a stacking context without changing layout or
paint. Every `z-index` inside `.root` is then resolved against the root's own
level, so a `z-index: 9999` sticky header competes with its siblings rather
than with the portalled popup.

Apply it to the element that wraps your page content — the one that is a sibling
of the portal target, not an ancestor of it:

```tsx
// app/layout.tsx
<body>
  <div className='root'>{children}</div>
</body>
```

Do not put it on `<body>` or `<html>`. The portal mounts inside `<body>`, so
isolating there puts the popup in the same stacking context as the content it
needs to paint above.

## Verify

- The UserButton renders with a border, radius, and spacing → stylesheet is
  loaded.
- Its menu opens above your header and sticky elements → root is isolated.
- A `:root { --cl-color-primary: red }` rule turns the primary button red →
  layers are ordered such that your CSS wins.
