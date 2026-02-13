# shadcn UI Setup

## CLI Options

| Option | Choices | Required | Default | Description |
|--------|---------|----------|---------|-------------|
| Base | `radix`, `baseui` | no | `radix` | Base component library |
| Style | `nova`, `vega`, `maia`, `lyra`, `mira` | no | `nova` | Visual style preset |
| Base color | `zinc`, `neutral`, `stone`, `gray` | no | `neutral` | Base color for components |
| Theme | `indigo`, `purple`, `amber`, `yellow`, `sky`, `blue`, `cyan`, `teal`, `emerald`, `green`, `lime`, `pink`, `rose`, `red`, `violet`, or match base color | no | base color | Theme accent color |
| Icons | `lucide`, `tabler`, `hugeicons`, `phosphor`, `remixicon` | no | `lucide` | Icon library |
| Font | `inter`, `geist`, `noto-sans`, `nunito-sans`, `figtree`, `roboto`, `railway`, `dm-sans`, `public-sans`, `outfit`, `geist-mono`, `jetbrains-mono` | no | `inter` | Font family |
| Menu accent | `subtle`, `bold` | no | `subtle` | Menu accent style |
| Radius | `default`, `none`, `small`, `medium`, `large` | no | `default` | Border radius (`default` inherits from style) |
| Template | `next`, `start`, `vite` | no | `next` | Framework: Next.js, TanStack Start, or Vite |
| RTL | `true`, `false` | no | `false` | Right-to-left layout |
| Interactive | `--no-interactive` | no | — | Skip prompts, use all defaults |

If `--no-interactive` or `shadcn-defaults` is used, run the command below with all defaults.

## Bootstrap Command

Replace `{placeholders}` with selected options (or defaults if `--no-interactive` was used).

- Replace `[name]` with `.` if the project is in the cwd.
- If `npm` was not chosen as package manager, replace `npx` in the following command with `bunx --bun` or `<yarn|pnpm> dlx`

```bash
npx shadcn@latest create --preset "https://ui.shadcn.com/init?base={base}&style={style}&baseColor={baseColor}&theme={theme}&iconLibrary={iconLibrary}&font={font}&menuAccent={menuAccent}&menuColor=default&radius={radius}&template={template}&rtl={rtl}" --template {template} [name]
```
