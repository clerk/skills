// cypress/support/commands.ts
import { addClerkCommands } from '@clerk/testing/cypress';

// IMPORTANT: Use addClerkCommands instead of manual command definitions
addClerkCommands({ Cypress, cy });

// This adds the following commands automatically:
// - cy.clerkSignIn(params)
// - cy.clerkSignOut()
// - cy.clerkLoaded()
