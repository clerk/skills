**CLI options**

| Category | Args Options | Required | Default | Description |
|---------|-----------|----------|---------|-------------|
| `base`| `radix`, `baseui` |  no | `radix` | Base component library to use |
| `style` | `nova`, `vega`, `maia`, `lyra`, `mira` | no | `nova` | Additional styles to apply |
| `base color` | `zinc`, `neutral`,  `stone`, `gray`  | no | `neutral` | Base color to apply to components |
| `theme` | `indigo`, `purple`, `amber`, `yellow`, `sky`, `blue`, `cyan`, `teal`, `emerald`, `green`, `lime`, `pink` `rose`, `red`, `violet` or match base color | no | `base color` | Theme color to apply to components. Will match `base color` by default |
| `icons` | `lucide`, `tabler`, `hugeicons`, `phospor`, `remixicon` | no | `lucide`| Icon library to use |
| `font` | `inter`, `geist`, `noto-sans`, `nunito-sans`, `figtree`, `roboto`, `railway`, `dm-sans`, `public-sans`, `outfit`, `geist-mono`, `jetbrains-mono` | no | `inter`| Font library to use |
| `menu accent` | `subtle`, `bold` | no | `subtle`| Menu Accent |
| `radius` | `default`, `none`, `small`, `medium`, `large` | no | `default`| Border radius. `default` will inherit radius from `style`. |
| `template` | `next`, `start`, `vite` | no | `next`| Framework to use. Options are Next.js, Tanstack Start or Vite  |
| `rtl` | boolean | no | `false`| Use RTL layout |
| `interactive` | `--no-interactive` | no | n/a | Skip interactive prompts and use all defaults |


- If `--no-interactive` or `shadcn-defaults` is used, run the command below with all defaults.


**Bootstrap command**
- Use `pnpm dlx`, `bunx --bun` or `yarn dlx` or `npx` based on the user's selected package manager.
- Run `<pm_cmd> shadcn@latest create --preset "https://ui.shadcn.com/init?base={base}&style={style}&baseColor={baseColor}&theme={theme}&iconLibrary={iconLibrary}&font={font}&menuAccent={menuAccent}&menuColor=default&radius={radius}&template={template}&rtl={rtl}"  --template {template} <name> (or '.' if using cwd)` replacing placeholders with selected options (or defaults if `--no interactive` was used).

