// cypress.config.ts
import { clerkSetup } from '@clerk/testing/cypress';
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // IMPORTANT: Call clerkSetup in setupNodeEvents
      return clerkSetup({ config });
    },
  },
});
