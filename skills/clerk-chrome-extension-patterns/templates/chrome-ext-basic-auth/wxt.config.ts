import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Function form: WXT loads .env files after evaluating this config
  manifest: () => ({
    key: import.meta.env.WXT_CRX_PUBLIC_KEY,
    permissions: ['cookies', 'storage'],
    host_permissions: ['http://localhost/*', `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`],
  }),
})
