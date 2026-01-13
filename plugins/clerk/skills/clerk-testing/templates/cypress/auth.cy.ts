// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow signed-in user to access dashboard', () => {
    // Use the automatically added cy.clerkSignIn command
    cy.clerkSignIn({
      strategy: 'password',
      identifier: Cypress.env('E2E_CLERK_USER_USERNAME'),
      password: Cypress.env('E2E_CLERK_USER_PASSWORD'),
    });

    // Wait for Clerk to be loaded
    cy.clerkLoaded();

    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should redirect unauthenticated user', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/sign-in');
  });

  it('should sign out successfully', () => {
    cy.clerkSignIn({
      strategy: 'password',
      identifier: Cypress.env('E2E_CLERK_USER_USERNAME'),
      password: Cypress.env('E2E_CLERK_USER_PASSWORD'),
    });

    cy.clerkLoaded();
    cy.visit('/dashboard');

    cy.clerkSignOut();

    cy.visit('/dashboard');
    cy.url().should('include', '/sign-in');
  });
});
