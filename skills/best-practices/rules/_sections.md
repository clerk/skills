# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Password Validation (password)

**Impact:** CRITICAL
**Description:** Clerk enforces password strength, breach detection, and zxcvbn scoring automatically. Custom flows must replicate these protections.

## 2. Email Verification (email)

**Impact:** CRITICAL
**Description:** OTP delivery, expiration, and retry limits prevent account takeover. Skipping verification leaves accounts vulnerable.

## 3. Bot Protection (bot)

**Impact:** CRITICAL
**Description:** CAPTCHA and rate limiting on auth attempts block credential stuffing and automated abuse.

## 4. Session Management (session)

**Impact:** CRITICAL
**Description:** Short-lived JWTs with automatic refresh and revocation prevent session hijacking and stale access.

## 5. Multi-Factor Auth (mfa)

**Impact:** HIGH
**Description:** TOTP, SMS, and backup code flows add a second layer of identity verification. Must be enforced when enabled.

## 6. OAuth Flows (oauth)

**Impact:** HIGH
**Description:** PKCE, state/nonce validation, and secure token exchange prevent authorization code interception and CSRF.

## 7. Error Handling (error)

**Impact:** HIGH
**Description:** Generic error messages prevent user enumeration. Structured error handling avoids leaking internal state.

## 8. Brute-Force Protection (brute)

**Impact:** HIGH
**Description:** Account lockout and progressive delays stop credential stuffing without degrading legitimate user experience.

## 9. Input Sanitization (input)

**Impact:** HIGH
**Description:** XSS vectors in auth forms — name fields, OAuth profile data, error messages — must be neutralized.

## 10. Accessibility (a11y)

**Impact:** MEDIUM
**Description:** ARIA labels, focus management, and keyboard navigation ensure auth flows are usable by everyone.

## 11. Loading States (loading)

**Impact:** MEDIUM
**Description:** Disabled buttons and progress indicators prevent double submissions and give users feedback during async operations.

## 12. Redirect Safety (redirect)

**Impact:** MEDIUM
**Description:** Allowlisted redirect URLs and open-redirect prevention stop attackers from hijacking post-auth navigation.
