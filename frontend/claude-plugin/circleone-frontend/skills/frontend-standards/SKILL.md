---
name: frontend-standards
description: Circleone's enforceable frontend coding standards for Stack A (Next.js 16 App Router + TypeScript) and Stack B (Vite + React + TanStack Router + TypeScript). Use this skill whenever writing, editing, reviewing, refactoring, or generating ANY frontend code in a Circleone repository — components, hooks, forms, styling (Tailwind, shadcn/ui registry), client/server state (Zustand, Jotai, TanStack Query, Server Actions), routing, folder structure, TypeScript, naming, tests, accessibility, performance, security, or ESLint/Prettier config — even for small edits and even when the user doesn't mention standards. Also use it when answering questions about how Circleone frontend code should be written or reviewed.
---

# Circleone Frontend Standards

These are enforceable team standards, not suggestions. Code that violates a MUST will be rejected in review, so following them on the first pass saves the whole team a round-trip.

The rules ship in two layers:

- `rules/` — compact digests with every rule but no example code. **Read these by default.**
- `references/` — the full files, where rules are illustrated with ✅ (correct) / ❌ (wrong) code examples. Open the matching full file whenever a rule is ambiguous, when the right and wrong versions of a pattern look similar (form wiring, memoization, cva variants), or when you're about to deviate. Each digest links to its full file at the top.

Links inside the files pointing to `tooling/` are intentionally not bundled — editor and lint setup is enforced by CI, not by you. Ignore those links.

## Workflow

1. **Identify the stack** of the repository you are working in:
   - **Stack A** — `package.json` depends on `next` (Next.js 16, App Router).
   - **Stack B** — `package.json` depends on `vite` and `@tanstack/react-router`.
   - Rules apply to both stacks unless a file has explicit `### Stack A` / `### Stack B` subheadings; then apply only the matching one.
2. **Read `rules/conventions.md` first** (once per session). It defines the rule keywords, precedence order, exception process, and definition of done. Everything else depends on it.
3. **Read the topic files relevant to the change** (see routing table below) *before* writing code, not after.
4. **Apply the rules while writing.** Don't write code first and patch it to comply afterwards — architecture and form-wiring rules shape the code from the start.

## How to read the rules

Rules use RFC 2119 keywords, always uppercase:

- **MUST / MUST NOT** — non-negotiable; blocks merge. Never violate these. If a MUST seems wrong for the situation, say so and suggest the user open an issue against the standards — do not silently deviate.
- **SHOULD / SHOULD NOT** — strong default. Deviate only with a stated reason, marked inline in this greppable format:
  `// SHOULD-EXCEPTION(<file-or-topic>): <reason>. Approved by @<reviewer> in PR #<n>.`
- **MAY** — permitted, no preference.

Lines without a keyword are context, not rules.

**Precedence when rules appear to conflict** (higher wins):

1. Security and accessibility rules override anything that would weaken them.
2. Stack-specific rules override general rules for that stack.
3. Topic files override the README.
4. An explicit keyworded rule overrides assumptions about unstated cases.

If a real conflict survives this order, stop and tell the user — the standards say to open an issue rather than guess.

## Routing table

Read every file whose area the change touches. Most changes touch several (a new form touches forms, components, styling, naming, and accessibility at minimum).

| Change touches | Read |
| --- | --- |
| Folder layout, routing, data fetching, Server Actions, caching (Stack A) | `rules/architecture/nextjs.md` |
| Folder layout, TanStack Router, loaders, code splitting, env vars (Stack B) | `rules/architecture/vite-react.md` |
| Any TypeScript (types, assertions, tsconfig) | `rules/code/typescript.md` |
| Components, props, conditional rendering, loading/empty/error states | `rules/code/components.md` |
| Styling, Tailwind classes, cva variants, theme tokens, dark mode | `rules/code/styling.md` |
| Names of files, components, hooks, booleans, handlers, types | `rules/code/naming.md` |
| Any form — always start here | `rules/code/forms.md` |
| Forms wired with React Hook Form | `rules/code/forms-react-hook-form.md` |
| Forms wired with TanStack Form | `rules/code/forms-tanstack-form.md` |
| Anything user-facing (markup, focus, contrast, ARIA, motion) | `rules/accessibility.md` |
| Images, fonts, imports, memoization, bundles, third-party scripts | `rules/performance.md` |
| Untrusted input, auth, tokens, env vars, uploads, dependencies | `rules/security.md` |
| Tests — what deserves one, Vitest/RTL, mocks, Playwright, Storybook, flaky policy | `rules/testing.md` |

Topics not yet covered by a rule file (currently state-and-data specifics beyond what architecture files cover): follow the patterns visible in the repository and general best practice, and tell the user the standards don't cover it yet. Editor and lint/format setup is deliberately excluded — CI enforces it.

## Definition of done

Before presenting code as finished, verify:

- Complies with every MUST / MUST NOT in the files relevant to the change.
- Every SHOULD deviation carries an inline `SHOULD-EXCEPTION` justification.
- Lint, format, and type check pass with zero warnings and no new `@ts-expect-error` without a linked issue.
- User-facing changes implement the required loading, empty, and error states from `rules/code/components.md`.

When reviewing code rather than writing it, cite the specific file and rule for each violation you flag.
