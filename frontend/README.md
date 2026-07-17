# Circleone Frontend Standards

Enforceable standards for Circleone frontend development.

## Scope

These standards govern frontend code across all three production stacks:

- **Stack A**: Next.js 16 (App Router) + TypeScript
- **Stack B**: React + Vite + TanStack Router + TypeScript
- **Stack C**: React Native + Expo + TypeScript + TanStack Query (mobile)

Shared tooling covered here: Tailwind on a custom shadcn/ui registry, Zustand/Jotai (client state), TanStack Query plus Next.js Server Actions and fetch caching (server state), Vitest + React Testing Library, and ESLint + Prettier.

Out of scope: backend services, infrastructure, CI pipeline internals, design-token authoring, and any repository that is not a frontend application.

## Audience

Frontend developers at Circleone, new and existing, across all seniority levels. Read `conventions.md` before contributing code.

## How to navigate

Start with [`conventions.md`](./conventions.md). It defines the MUST / SHOULD / MAY keywords, the precedence order when rules conflict, the exception process, and the definition of done. Every other file depends on it.

Then read by area:

| Area                   | File                                                               | Covers                                                                          |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Architecture (Stack A) | [`architecture/nextjs.md`](./architecture/nextjs.md)               | Folder layout, server/client split, Server Actions, caching, boundaries         |
| Architecture (Stack B) | [`architecture/vite-react.md`](./architecture/vite-react.md)       | Folder layout, TanStack Router, loaders, code splitting, env vars               |
| Architecture (Stack C) | [`architecture/expo-react-native.md`](./architecture/expo-react-native.md) | Folder layout, Expo Router, TanStack Query on native, env vars, EAS     |
| TypeScript             | [`code/typescript.md`](./code/typescript.md)                       | tsconfig flags, type vs interface, `any`/`unknown`, assertions                  |
| Components             | [`code/components.md`](./code/components.md)                       | Categories, props, conditional rendering, memoization, states                   |
| Styling                | [`code/styling.md`](./code/styling.md)                             | Tailwind, registry-first, `cva`, theme tokens, dark mode                        |
| Naming                 | [`code/naming.md`](./code/naming.md)                               | Files, components, hooks, booleans, handlers, types                             |
| State and data         | [`code/state-and-data.md`](./code/state-and-data.md)               | Zustand vs Jotai, query keys, caching, mutations, shared types                  |
| Forms (shared)         | [`code/forms.md`](./code/forms.md)                                 | Library selection, Zod schema rule, registry `<Field />` family, error contract |
| Forms: React Hook Form | [`code/forms-react-hook-form.md`](./code/forms-react-hook-form.md) | RHF wiring: `<Controller />`, field spread, `useFieldArray`, server errors      |
| Forms: TanStack Form   | [`code/forms-tanstack-form.md`](./code/forms-tanstack-form.md)     | TanStack Form wiring: `form.Field` render prop, `field.state`, array mode       |
| Testing                | [`testing.md`](./testing.md)                                       | What to test, Vitest, Playwright, Storybook, coverage, flaky policy             |
| Performance            | [`performance.md`](./performance.md)                               | Budgets, images, fonts, dynamic imports, memoization, CI gates                  |
| Accessibility          | [`accessibility.md`](./accessibility.md)                           | WCAG 2.1 AA, semantic HTML, keyboard, focus, contrast, labels                   |
| Security               | [`security.md`](./security.md)                                     | Input validation, tokens, authorization, env prefixes, dependencies             |
| Tooling (editor)       | [`tooling/editor.md`](./tooling/editor.md)                         | Required extensions, `.vscode/settings.json`, `.editorconfig`                   |
| Tooling (lint/format)  | [`tooling/lint-format.md`](./tooling/lint-format.md)               | ESLint/Prettier config, pre-commit hooks, CI checks                             |

When a rule differs between stacks, the file states both explicitly under stack subheadings. When no stack is named, the rule applies to both.

## Reporting issues and proposing changes

These are living documents. To change them:

1. Open an issue describing the problem or proposed rule.
2. Open a PR against this repository. All changes go through PR review.
3. For a one-off exception to an existing rule rather than a change to the rule itself, follow the exception process in [`conventions.md`](./conventions.md).
