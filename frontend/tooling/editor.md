# Editor

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. The standardized editor is VS Code. Editor config is a convenience layer that gives every developer the same in-loop feedback; it is not the enforcement gate. The gate is CI, defined in [`lint-format.md`](./lint-format.md).

## Required extensions

- VS Code/Cursor MUST be configured with these three extensions. Without them, format-on-save and lint feedback do not match CI.
  - ESLint (`dbaeumer.vscode-eslint`)
  - Prettier (`esbenp.prettier-vscode`)
  - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
- The repository MUST commit a `.vscode/extensions.json` that recommends them, so a new clone prompts the install.

```jsonc
// ✅ .vscode/extensions.json — committed, prompts on first open
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Recommended extensions

- These SHOULD be installed. They surface problems earlier but change nothing CI checks.
  - Error Lens (`usernamehw.errorlens`)
  - Pretty TypeScript Errors (`yoavbls.pretty-ts-errors`)
  - Vitest (`vitest.explorer`)
- Any other extension MAY be installed for personal use.
- A personal extension MUST NOT change shared formatting or lint behavior (no alternate formatter, no auto-import reorderer that fights Prettier). If an extension rewrites code on save, it MUST agree with the committed config.

## `.vscode/settings.json`

- The repository MUST commit this block. It makes save apply Prettier and ESLint fixes the same way CI verifies them.
- Format on save MUST be on, Prettier MUST be the default formatter, and ESLint MUST run as a fix-on-save code action.
- The workspace TypeScript SDK MUST be used so editor errors match the repo's `tsc`, not the editor's bundled version.

```jsonc
// ✅ .vscode/settings.json — committed
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  // Sort and autocomplete classes inside cn() and cva()
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

```jsonc
// ❌ A personal formatter override that drifts from CI
{
  "editor.formatOnSave": false,
  "editor.defaultFormatter": "rvest.vs-code-prettier-eslint"
}
```

## `.editorconfig`

- The repository MUST commit this block. It pins whitespace and line endings for files Prettier does not own, and keeps diffs clean across operating systems.
- Settings here MUST agree with Prettier. The two MUST NOT specify conflicting indent or line-ending rules.

```ini
# ✅ .editorconfig — committed at the repository root
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- `end_of_line = lf` is required on every platform. A Windows clone MUST NOT commit CRLF.

## Line endings

- `.editorconfig` sets the intent; Git MUST enforce it. The repository MUST commit a `.gitattributes` that normalizes line endings, so a Windows clone cannot introduce CRLF regardless of a developer's local `core.autocrlf`.
- Developers MUST NOT rely on `core.autocrlf` for correctness. It is per-machine and unset on a fresh clone; `.gitattributes` is committed and binds everyone.

```gitattributes
# ✅ .gitattributes — committed at the repository root
* text=auto eol=lf
*.png binary
*.jpg binary
*.woff2 binary
```

## Editor config is not the gate

- Editor settings MUST NOT be treated as enforcement. A developer with format-on-save off is still bound by every rule.
- The merge-blocking checks live in CI, not in the editor (see [`lint-format.md`](./lint-format.md)). A green editor is necessary, not sufficient.
