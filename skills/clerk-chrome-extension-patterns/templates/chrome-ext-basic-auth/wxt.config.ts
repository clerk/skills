import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Function form: WXT loads .env files after evaluating this config
  manifest: () => ({
    key: import.meta.env.WXT_CRX_PUBLIC_KEY,
    permissions: ['cookies', 'storage'],
    host_permissions: ['http://localhost/*', `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`],
  }),
  // Stops `wxt build` / `wxt zip` without env vars. Not in `manifest`: `wxt prepare` runs it in production mode on install.
  hooks: {
    'build:before': (wxt) => {
      if (!import.meta.env.WXT_CLERK_PUBLISHABLE_KEY || !import.meta.env.WXT_CLERK_FRONTEND_API) {
        throw new Error(
          `Add WXT_CLERK_PUBLISHABLE_KEY and WXT_CLERK_FRONTEND_API to your .env.${wxt.config.mode} file`,
        )
      }
    },
  },
})
