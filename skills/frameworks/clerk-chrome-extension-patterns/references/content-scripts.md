# Content Scripts (HIGH)

## Constraint

Content scripts run in an isolated JavaScript world injected into web pages. They cannot directly access the extension's React context or Clerk's session state.

## Check Auth via Message Passing

```typescript
// content.ts — send message to background
async function isUserSignedIn(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
      resolve(response?.isSignedIn ?? false)
    })
  })
}

async function injectUI() {
  const signedIn = await isUserSignedIn()

  if (!signedIn) {
    console.log('User not signed in, skipping injection')
    return
  }

  const overlay = document.createElement('div')
  overlay.id = 'my-extension-overlay'
  document.body.appendChild(overlay)
}

injectUI()
```

```typescript
// background.ts — respond to auth check
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'CHECK_AUTH') {
    chrome.storage.session.get('clerkToken').then(({ clerkToken }) => {
      sendResponse({ isSignedIn: !!clerkToken })
    })
    return true
  }
})
```

## Manifest Permissions

`package.json` (Plasmo):
```json
{
  "manifest": {
    "permissions": ["storage", "tabs"],
    "host_permissions": ["<all_urls>"]
  }
}
```

For cross-origin auth with specific domains:
```json
{
  "manifest": {
    "permissions": ["storage", "tabs", "webNavigation"],
    "host_permissions": ["https://yourdomain.com/*"]
  }
}
```

## Content Script Registration

In Plasmo, a file named `content.ts` (or `content.tsx`) at the root is auto-registered as a content script.

For multiple content scripts with different match patterns, use the `manifest` key in `package.json`:
```json
{
  "manifest": {
    "content_scripts": [
      {
        "matches": ["https://specific-site.com/*"],
        "js": ["content.js"]
      }
    ]
  }
}
```

[Docs](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
