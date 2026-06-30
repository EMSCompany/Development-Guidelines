# Lint and format

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. This file is the enforcement backstop the other standards point at. Where another file states a rule, lint enforces it; this file says where that enforcement lives and what blocks merge. The editor setup that mirrors these checks in-loop is in [`editor.md`](./editor.md).

## Shared ESLint config

- Both stacks MUST extend one shared flat config. The source of truth is a single `eslint.config.ts` at the `Development-Guidelines` root. A repository MUST import and extend it. A repository MUST NOT fork or re-declare the rule set.
- A repo's own `eslint.config.ts` MAY add rules for stack-specific concerns. It MUST NOT relax or delete a rule from the shared config to make local code pass; that is an exception and goes through the process in [`../conventions.md`](../conventions.md).
- The shared config MUST bundle: TypeScript (`typescript-eslint`), React, React Hooks, `jsx-a11y`, and import-order rules. Stack additions are below.

```ts
// ✅ Repo eslint.config.ts extends the shared root config
import shared from "../eslint.config.ts";
import next from "@next/eslint-plugin-next";

export default [...shared, next.configs["core-web-vitals"]];
```

```ts
// ❌ Repo redefines the rule set and silently drops rules
export default [
  { rules: { "jsx-a11y/alt-text": "off", "no-restricted-syntax": "off" } },
];
```

### Stack A

- The shared config MUST be extended with `@next/eslint-plugin-next` (`core-web-vitals`). The Next.js rules MUST NOT be disabled wholesale.

### Stack B

- The shared config MUST be extended with the TanStack Router plugin rules. File-based route conventions are owned by [`../architecture/vite-react.md`](../architecture/vite-react.md); lint enforces them.

## What lint enforces

This file does not restate rules other files own. Lint is where they are mechanically checked. The enforced set includes, with the owning file:

- `enum` ban and `any` policy — [`../code/typescript.md`](../code/typescript.md)
- `jsx-a11y` accessibility rules — [`../accessibility.md`](../accessibility.md)
- No barrel files, no `import *` from large libraries, subpath imports — [`../performance.md`](../performance.md)
- Tailwind class sorting — see Prettier below, config owned by [`../code/styling.md`](../code/styling.md)
- React Hooks rules of hooks and exhaustive-deps — [`../code/components.md`](../code/components.md)

A rule in this list MUST NOT be weakened in a repo config. If a rule is wrong, change it in the shared config for everyone (see [`../conventions.md`](../conventions.md)), not locally.

## Prettier

- Prettier MUST be the only formatter. Code style (quotes, spacing, semicolons, line width) MUST NOT be argued in review; the formatter decides.
- The config MUST be committed and identical across both stacks. `prettier-plugin-tailwindcss` MUST be listed last in `plugins` so it runs after any other plugin.
- `tailwindFunctions` MUST list `cn` and `cva` so classes inside them sort too. This MUST match what [`../code/styling.md`](../code/styling.md) requires.

```js
// ✅ prettier.config.js — committed, shared by both stacks
/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  printWidth: 80,
  trailingComma: "all",
  // tailwindcss plugin MUST be last
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
};
```

```js
// ❌ Tailwind plugin not last; classes will not sort
export default {
  plugins: ["prettier-plugin-tailwindcss", "@trivago/prettier-plugin-sort-imports"],
};
```

## Pre-commit hooks

- The repository MUST run Husky + lint-staged on commit. The hook MUST run ESLint `--fix` and Prettier `--write` on staged files only, not the whole tree.
- Hooks are a fast local convenience, not the gate. CI re-runs the same checks on the full diff. A passing hook MUST NOT be taken as proof CI will pass.
- A commit MUST NOT be landed with `--no-verify` to skip a failing hook. Bypassing the hook to push broken code is a defect, not a workaround.

```jsonc
// ✅ package.json — staged-only, fix then format
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

```jsonc
// ❌ Lints the entire repo on every commit; slow and not staged-scoped
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint . --fix"]
  }
}
```

## CI checks that block merges

- CI is the authoritative gate. These checks MUST run on every PR and MUST block merge on failure. CI MUST install with `npm ci` against the committed lockfile (see [`../security.md`](../security.md)).
- Lint MUST run with zero tolerance for warnings: `eslint . --max-warnings=0`. A warning is a failure. This is what "lint passes with zero warnings" in the definition of done refers to (see [`../conventions.md`](../conventions.md)).
- Format MUST be verified, not applied, in CI: `prettier --check .`. A formatting drift blocks merge.
- Type check MUST pass with no new errors: `tsc --noEmit`. A new `// @ts-expect-error` without a linked issue MUST NOT merge.

```bash
# ✅ The merge-blocking lint/format/type gate
npm ci
npx eslint . --max-warnings=0
npx prettier --check .
npx tsc --noEmit
```

- The performance, accessibility, and security gates are separate CI jobs owned by [`../performance.md`](../performance.md), [`../accessibility.md`](../accessibility.md), and [`../security.md`](../security.md). They block merge on the same PR. This file owns only lint, format, and type check.

## Disabling a rule inline

- An inline disable is allowed only for a single line, with the specific rule named, and a reason on the same or preceding line. A bare `eslint-disable` MUST NOT appear.
- A whole-file disable (`/* eslint-disable */` at the top) MUST NOT be used. Disable the one line that needs it.
- A `jsx-a11y` rule or a security-related rule MUST NOT be disabled without an accepted exception comment in the shape defined in [`../conventions.md`](../conventions.md). These are precedence floors.

```tsx
// ✅ Single line, named rule, justified
// SHOULD-EXCEPTION(performance): measured hot path, see PR #318.
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => sync(), []);
```

```tsx
// ❌ Blanket disable hides every future violation in the file
/* eslint-disable */
```
