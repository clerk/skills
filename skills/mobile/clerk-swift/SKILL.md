---
name: clerk-swift
description: Set up Clerk in native iOS or macOS Xcode apps and implement Swift authentication with ClerkKit or ClerkKitUI. Use the native-aware Clerk CLI when available; use source-guided Swift patterns for UI work or manual setup. Do not use for Expo or React Native projects.
license: MIT
metadata:
  author: clerk
  version: 1.3.0
compatibility: Requires Xcode and the clerk-ios Swift package for native app implementation
---

# Clerk Swift (Native Apple)

Use this skill for a native Swift iOS or macOS app. An `.xcodeproj` or `.xcworkspace` with an application target is useful evidence; a bare `Package.swift` is not proof of a native app. Route Expo and React Native projects to `clerk-expo` instead.

Separate project setup from authentication UI work:

| Request | Path |
| --- | --- |
| Add Clerk to an existing Xcode app | Use the native-aware `clerk init` path below when available; also load `clerk-setup` and `clerk-cli` |
| Add prebuilt `AuthView` or `UserButton` UI | Complete or verify setup, then load [references/prebuilt.md](references/prebuilt.md) |
| Implement a custom Swift auth flow | Complete or verify setup, then load [references/custom.md](references/custom.md) |
| Expo or React Native | Use `clerk-expo`, not this skill |

Adding Clerk does **not** imply replacing the app's UI, opting into Sign in with Apple, or choosing a custom auth flow. Do not ask for a prebuilt/custom choice or a publishable key merely to begin a basic setup request.

Core setup alone may not give users a way to sign in. If Doctor reports a missing authentication flow after `clerk init`, do not call the app's authentication complete. Inspect any existing entry UI; for a request to make sign-in usable, integrate the requested or clearly existing flow. If the UI choice remains material and unclear, ask about prebuilt versus custom **after** progressing through safe setup, and report what remains.

## Native-aware CLI setup

Installed CLI versions differ. Before invoking `clerk init` on a native project, check `clerk init --help` for the native `--dry-run` and `--target` options. Do not assume an older installed CLI understands Xcode projects. If those options are absent, use the manual path below or explain how to obtain a native-capable CLI; do not run the older init flow on the app.

For a supported, existing iOS or macOS Xcode app:

1. Run `clerk init --dry-run --json` from the intended project directory. This is read-only and needs no permission question. Read the top-level `status` and diagnostics, not just the exit code: a blocked inspection can exit successfully. Use `--target` only when the project has multiple app targets or the developer selected one. If prebuilt UI or native Apple sign-in was explicitly requested, include the matching `--prebuilt-auth-ui` or `--sign-in-with-apple` flag in the dry run as well as the eventual apply so the preview covers that change. Do not pass `--app` or `--app-id-prefix` to dry-run; those are regular-run choices.
2. For a human at an interactive terminal, use plain `clerk init` once the plan identifies the intended app. It previews local and remote changes and prompts for the required choices. For an agent or other non-interactive run, use `clerk init --yes` only when the developer has requested setup and the plan is safe. `--yes` is required for native mutation in agent mode; it does not opt into extra features or override a blocker.
3. Let the CLI select or create the Clerk application and obtain the development publishable key for a fresh, proven SwiftUI app. Do not request the key up front, run `clerk env pull`, or write a new `.env`/`LocalSecrets.plist` for ordinary native setup. The CLI preserves an existing custom `Clerk.configure(...)` source without reading its key. In agent mode, that custom path needs an explicit `--app <app_id>` to identify the linked application; the CLI does not prove the custom key's value matches it.
4. Pass `--prebuilt-auth-ui` only when the developer explicitly wants Clerk's prebuilt UI. It can replace an untouched starter screen, not existing custom UI. Pass `--sign-in-with-apple` only when native Apple sign-in was explicitly requested. These are independent choices and neither is implied by `--yes`.
5. If the plan needs an App ID Prefix and cannot prove one, obtain the developer's choice or use the CLI's interactive suggestion. `DEVELOPMENT_TEAM` is only a suggestion, not proof. In agent mode pass `--app-id-prefix` only with a value the developer confirmed or reliable project evidence supplies.
6. After setup, run `clerk doctor --json` where native-aware Doctor is available, using the same `--target` when selection is ambiguous. Doctor diagnoses setup; it does not build, resolve packages, or launch a simulator. When Xcode is available and setup changed Swift or project files, build the selected target; exercise the sign-in flow when UI work was completed. Report clearly when build or runtime verification could not be performed.

The native CLI intentionally refuses automatic mutation for unsupported or uncertain targets, including a target that also ships visionOS or has Mac Catalyst enabled. It can still inspect and explain the problem. A blocked **dry-run** plan means do not apply it; `--yes` cannot override missing evidence. A later authenticated run can still leave partial state, such as a newly created or updated Clerk application link, or committed local files before a remote failure. Report that state and reuse it on retry rather than claiming the project was untouched. XcodeGen and Tuist generated output should be changed at its generator source, not edited as if it were hand-maintained.

## Manual and UI-specific work

When native CLI support is unavailable, or a requested integration lies outside its safe mutation boundary, inspect the selected target and follow the current [Clerk iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart) plus the installed `clerk-ios` package source. Preserve existing application structure and custom key loading. Ask for a publishable key or application choice only when it cannot be obtained from authorized project context and is actually needed for the manual change. Do not treat a repository `.env` value as proof that the native target uses it.

For UI-specific work, inspect the installed `ClerkKit`/`ClerkKitUI` APIs before editing. Choose one reference based on the request or existing implementation. Ask whether the developer wants prebuilt or custom UI only when that choice materially changes the result and cannot be inferred. Do not blend both references by default. `AuthView` can reflect enabled authentication methods from the Clerk instance. Its presence alone does not authorize enabling a new provider, but a method already enabled for that instance may require a matching local capability. Review that conditional edit in the authenticated CLI plan.

Do not make a direct `/v1/environment` request as a universal setup prerequisite. The SDK fetches its environment at runtime. For a custom feature or provider-specific decision, inspect the current SDK behavior and instance configuration, then obtain only the evidence needed for that decision. Never persist private credentials or raw environment responses in the project.

## Verification

- Confirm the intended native application target and platform, not merely the repository folder.
- Confirm the CLI plan was applied or report its blocker and any partial state accurately.
- Confirm `ClerkKit` and, when used, `ClerkKitUI` are linked to the selected target, and that its actual app root configures and injects Clerk.
- Check platform-specific capabilities relevant to the chosen flow: Associated Domains for iOS where needed, outgoing network access for sandboxed macOS apps, and the Apple entitlement only for native Sign in with Apple.
- Run native-aware `clerk doctor` for diagnostics when available. Build the selected target after source/project changes when Xcode is available; exercise completed authentication UI. A successful Doctor result is not a substitute for either check.

## See also

- `clerk-setup` for the broader setup workflow
- `clerk-cli` for exact CLI behavior and agent-mode safeguards
- [clerk-ios](https://github.com/clerk/clerk-ios) for SDK source and examples
