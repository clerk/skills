// cypress/support/e2e.ts
import { addClerkCommands } from '@clerk/testing/cypress';

addClerkCommands({ Cypress, cy });

// cypress.config.ts
// import { defineConfig } from 'cypress';
// import { clerkSetup } from '@clerk/testing/cypress';
//
// export default defineConfig({
//   e2e: {
//     baseUrl: 'http://localhost:3000',
//     setupNodeEvents(on, config) {
//       return clerkSetup({ config });
//     },
//   },
// });
