# Chrome Extensions without WXT + React

The Quick Start in SKILL.md uses WXT with React. The SDK itself isn't tied to either. Use this reference for plain TypeScript, Plasmo, plain Vite, or a non-React UI framework (Vue, Svelte, Solid) in WXT or anywhere else.

Every CRITICAL RULE in SKILL.md still applies. Only the build tool, the env var names, and where the manifest lives change.

## What Every Setup Needs

1. In the Clerk Dashboard, enable the **Native API**. In the development instance only, turn off **Challenge suspicious sign-ups** (or legacy **Bot sign-up protection**) and **Require Device Intelligence checks**. Leave them on in production (see rule 8 in SKILL.md).
2. Bundle `@clerk/chrome-extension` `^3.1.105` or later into the extension. Never load Clerk from a CDN or a `<script src="https://...">` tag: the Chrome Web Store rejects remotely hosted code, and 3.1.105 is the first release that doesn't fetch Protect scripts remotely.
3. Manifest:
   - `permissions`: `["cookies", "storage"]`
   - `host_permissions`: `http://localhost/*` (development), your Frontend API URL with `/*`, and your sync host with `/*` if you use one
   - `key`: the public key that pins the CRX ID (see Stable CRX ID in SKILL.md)
4. Build redirect URLs from `chrome.runtime.getURL('popup.html')`. Without React, also pass `allowedRedirectProtocols: ['chrome-extension:']` to `clerk.load()`.
5. Hide social buttons with `appearance: { elements: { socialButtonsRoot: { display: 'none' }, dividerRow: { display: 'none' } } }`. OAuth and SAML go through `syncHost`.
6. In the background service worker, use `createClerkClient({ publishableKey, syncHost, background: true })` from `@clerk/chrome-extension/client`, exactly as in `create-clerk-client.md`.
7. Add `chrome-extension://<CRX ID>` to the instance's allowed origins.

## Pick the Entry Point

| Popup UI | Import | Use |
| --- | --- | --- |
| React (WXT, Plasmo, Vite) | `@clerk/chrome-extension` | `<ClerkProvider>` and components, as in the SKILL.md Quick Start |
| No React (plain TS, Vue, Svelte, Solid) | `@clerk/chrome-extension/client` | `createClerkClient()`, `clerk.load()`, then mount methods |

`<ClerkProvider>` and the components need React (`react` and `react-dom` are peer dependencies). Don't add React just to use them in a Vue, Svelte, or Solid popup. Use `/client` instead.

## Env Vars and Manifest by Tool

| Tool | Env vars in extension code | Manifest |
| --- | --- | --- |
| WXT | `WXT_` or `VITE_` prefix, read with `import.meta.env` | `wxt.config.ts`, `manifest: () => ({ ... })` |
| Plasmo | `PLASMO_PUBLIC_` prefix, read with `process.env` | `"manifest"` in `package.json`, `$VAR` placeholders |
| Vite | `VITE_` prefix, read with `import.meta.env` | Static `manifest.json` copied into the build output |
| esbuild (no framework) | Any name, replaced at build time with `define` | Static `manifest.json` |

For any other tool or framework, pass the Clerk values (Publishable Key, Frontend API URL, and sync host if used) the way that tool exposes build-time env vars to extension code, such as its required prefix or a `define`/replace step. Check that tool's docs for its env var rules. Extension code runs in the browser, so the values must be inlined at build time. There's no runtime `process.env`.

A Frontend API URL or sync host inside a static `manifest.json` is a literal value, not an env var. Keep a development and a production copy, or generate the file in your build script.

## Plain TypeScript (no framework)

Follow the [JavaScript quickstart](https://clerk.com/docs/getting-started/quickstart/chrome-extension-js) and its [example repo](https://github.com/clerk/clerk-chrome-extension-js-quickstart). It bundles `src/popup.ts` with esbuild and injects the key with `define: { 'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify(...) }`. The popup code is the "Vanilla JS Popup" example in `create-clerk-client.md`.

UI without React comes from the client's methods:

- `clerk.openSignIn()` / `clerk.openSignUp()` open the modal
- `clerk.mountSignIn(el)`, `clerk.mountSignUp(el)`, `clerk.mountUserButton(el)` render into a DOM node; `clerk.unmountSignIn(el)` and the matching `unmount*` methods remove them
- `clerk.addListener(render)` runs on every sign-in, sign-out, and session change

Pass `appearance` to `clerk.load()` so it applies to every component the client mounts or opens.

## Vue, Svelte, or Solid

Use `@clerk/chrome-extension/client` in the popup entry:

1. Call `createClerkClient({ publishableKey })` once, at module level.
2. `await clerk.load({ ...redirect URLs, allowedRedirectProtocols: ['chrome-extension:'], appearance })` before rendering anything that reads auth state.
3. Mount components into elements your framework renders (a template ref, `bind:this`, or a Solid `ref`) in its mount hook, and call the matching `unmount*` method in its teardown hook.
4. Copy `clerk.user` and `clerk.session` into the framework's reactive state inside a `clerk.addListener()` callback.

In WXT, swap `@wxt-dev/module-react` for the framework's module (for example, `wxt init --template vue`, `svelte`, or `solid`). The `wxt.config.ts` manifest, env files, `build:before` hook, and background worker stay the same as in SKILL.md.

## Plasmo (staying on it)

Plasmo is React-based, so `<ClerkProvider>` and the components work as in the Quick Start. Plasmo hasn't had a release in over a year, so recommend moving to WXT (see Migrating from Plasmo in SKILL.md). If the user stays on Plasmo:

- `.env.development` / `.env.production`: `PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_FRONTEND_API`, and `PLASMO_PUBLIC_CLERK_SYNC_HOST` if they use a sync host. Read them in code with `process.env.PLASMO_PUBLIC_...`.
- `.env.chrome`: `CRX_PUBLIC_KEY`.
- `package.json`:

  ```json
  "manifest": {
    "key": "$CRX_PUBLIC_KEY",
    "permissions": ["cookies", "storage"],
    "host_permissions": ["http://localhost/*", "$CLERK_FRONTEND_API/*"]
  }
  ```

  With a sync host, replace `http://localhost/*` with `$PLASMO_PUBLIC_CLERK_SYNC_HOST/*`.

- Redirect URLs: `chrome.runtime.getURL('popup.html')`. Background: `createClerkClient({ background: true })` in `src/background/index.ts`.
- Don't add a `tokenCache` prop. The SDK already keeps the session in `chrome.storage.local`.
- Bundle size: Plasmo's bundler duplicates Clerk's UI library into every lazy-loaded chunk. A `.parcelrc` of `{ "extends": "@plasmohq/parcel-config", "bundler": "@parcel/bundler-default" }`, with both packages as dev dependencies pinned to the versions the Plasmo release uses, shares it instead.

The last Plasmo versions of Clerk's examples are pinned at [clerk-chrome-extension-quickstart@64e1ef3](https://github.com/clerk/clerk-chrome-extension-quickstart/tree/64e1ef3) and [clerk-chrome-extension-demo@7679537](https://github.com/clerk/clerk-chrome-extension-demo/tree/7679537).

## Plain Vite

Clerk's own extension integration test builds with plain Vite ([`integration/templates/chrome-extension-vite`](https://github.com/clerk/javascript/tree/main/integration/templates/chrome-extension-vite)). It's a test fixture, not a starter, but it shows the build shape:

- Two builds: the popup (`popup.html` as the Rollup input) and the background worker (`src/background.ts`, `format: 'es'`, a single `background.js` file), then `manifest.json` copied into `dist/`.
- `"background": { "service_worker": "background.js", "type": "module" }` in the manifest.
- `define: { global: 'globalThis' }` in the popup build, since extension pages have no `global`.

## Related Docs

- [JavaScript quickstart](https://clerk.com/docs/getting-started/quickstart/chrome-extension-js)
- [`createClerkClient()` reference](https://clerk.com/docs/reference/chrome-extension/create-clerk-client)
- [Sync your Chrome Extension with your web app](https://clerk.com/docs/guides/sessions/sync-host)
- [Configure a consistent CRX ID](https://clerk.com/docs/guides/development/configure-consistent-crx-id)
- [Deploy a Chrome Extension to production](https://clerk.com/docs/guides/development/deployment/chrome-extension)
