---
title: Sanitize User-Supplied Content in Auth Flows
impact: HIGH
impactDescription: Prevents XSS via name fields, OAuth data, and error messages
tags: input, xss, sanitization, security
---

## Sanitize User-Supplied Content in Auth Flows

<!-- TODO: Document XSS vectors in auth forms (name fields, OAuth profile data,
     error messages). Show safe rendering patterns for user-supplied content
     returned from Clerk APIs. Include incorrect (dangerouslySetInnerHTML with
     error messages) vs correct (text-encoded) examples. -->
