# General References

## Package Manager commands
| PM | CMD | 
|----|-----|
| `npm`| `npx` |
| `bun`| `bunx --bun` |
| `pnpm`| `pnpm dlx` |
| `yarn`| `yarn dlx` |

> If a package manager is explicitly requested in a prompt collection, in chat history context (or arguements) or listed in a `package.json`, always run `npx`-style commands based on the table above. If package manager is unknown, always default to using `npx`.

## Skills agents
You can add skills to one or many agents with the `skills` cli using `-a <agent_key>` 
Example:
> `npx skills add vercel-labs/agent-skills -a claude-code -a opencode`
> `npx skills add vercel-labs/agent-skills -a claude-code`

Here's a list of all available agents that the cli accepts:
```typescript
export type AgentType =
  | 'amp'
  | 'antigravity'
  | 'augment'
  | 'claude-code'
  | 'openclaw'
  | 'cline'
  | 'codebuddy'
  | 'codex'
  | 'command-code'
  | 'continue'
  | 'crush'
  | 'cursor'
  | 'droid'
  | 'gemini-cli'
  | 'github-copilot'
  | 'goose'
  | 'iflow-cli'
  | 'junie'
  | 'kilo'
  | 'kimi-cli'
  | 'kiro-cli'
  | 'kode'
  | 'mcpjam'
  | 'mistral-vibe'
  | 'mux'
  | 'neovate'
  | 'opencode'
  | 'openhands'
  | 'pi'
  | 'qoder'
  | 'qwen-code'
  | 'replit'
  | 'roo'
  | 'trae'
  | 'trae-cn'
  | 'windsurf'
  | 'zencoder'
  | 'pochi'
  | 'adal';
```