// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.clerkSignIn({
      strategy: 'password',
      identifier: Cypress.env('E2E_CLERK_USER_USERNAME'),
      password: Cypress.env('E2E_CLERK_USER_PASSWORD'),
    });
  });

  it('shows dashboard when signed in', () => {
    cy.visit('/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('can sign out', () => {
    cy.visit('/dashboard');
    cy.clerkSignOut();
    cy.url().should('include', '/sign-in');
  });
});
