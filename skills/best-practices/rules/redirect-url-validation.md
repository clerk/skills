---
title: Validate Redirect URLs Against an Allowlist
impact: MEDIUM
impactDescription: Prevents open-redirect attacks after authentication
tags: redirect, open-redirect, allowlist, security
---

## Validate Redirect URLs Against an Allowlist

<!-- TODO: Document open-redirect risks, how Clerk validates redirect URLs
     against allowlisted origins in Dashboard, and how to replicate that
     validation in custom redirect logic. Show incorrect (blindly redirecting
     to query param) vs correct (checking against allowlist) examples. -->
