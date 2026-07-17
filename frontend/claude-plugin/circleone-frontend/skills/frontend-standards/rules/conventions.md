> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../references/conventions.md

# Conventions

How to read and apply every standard in this repository. Read this file before any other.

## RFC 2119 keywords

These standards use five keywords, per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They are always uppercase. When you see one, it carries the meaning below and nothing softer.

| Keyword        | Meaning                                                               | Enforcement                                           |
| -------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| **MUST**       | Absolute requirement. Non-negotiable.                                 | Blocks merge. Reviewers reject.                       |
| **MUST NOT**   | Absolute prohibition.                                                 | Blocks merge. Reviewers reject.                       |
| **SHOULD**     | Strong default. Deviate only with a stated, reviewer-accepted reason. | Reviewer may block. Requires justification in the PR. |
| **SHOULD NOT** | Strong discouragement. Same bar as SHOULD to override.                | Reviewer may block. Requires justification in the PR. |
| **MAY**        | Permitted. No preference either way.                                  | Never blocks.                                         |

A line with no keyword is context or explanation, not a rule. Only keyworded lines are enforceable.

## One line, one rule

Every rule is a single statement. Where a wrong version looks similar to a right version, the rule is followed by a `✅` / `❌` example. Where the rule is unambiguous in words, there is no example. Absence of an example does not weaken the rule.

## When stacks differ

Three production stacks exist:

- **Stack A**: Next.js 16 (App Router) + TypeScript
- **Stack B**: React + Vite + TanStack Router + TypeScript
- **Stack C**: React Native + Expo + TypeScript + TanStack Query (mobile)

Rules apply to every stack unless a file states otherwise under an explicit stack subheading. When a file has `### Stack A` / `### Stack B` / `### Stack C` subheadings for a topic, apply only the one matching the repository you are in. Web-only tooling (Tailwind, shadcn/ui registry) is governed identically across Stacks A and B unless stated and does not apply to Stack C. Cross-platform tooling (TypeScript, Zod, Zustand, Jotai, TanStack Query, ESLint, Prettier, testing) is governed identically across all three stacks unless stated. Rules that only make sense in a browser DOM (semantic HTML, CSS) do not bind Stack C; their intent (accessibility, consistent styling) still does.

## Precedence when rules conflict

When two rules appear to conflict, resolve in this order. Higher wins.

1. **Security and accessibility.** A rule in `security.md` or `accessibility.md` overrides any rule elsewhere that would weaken it. These are floors, not trade-offs.
2. **Stack-specific over general.** A rule under a `### Stack A`, `### Stack B`, or `### Stack C` subheading overrides a general rule on the same topic for that stack.
3. **More specific file over README.** Topic files override anything implied by `README.md`.
4. **Explicit keyword over silence.** A keyworded rule overrides a reader's assumption about unstated cases.

If a real conflict survives this order, treat it as a defect in the standards. MUST open an issue and MUST NOT guess. Resolve the conflict in the standards before merging code that depends on the resolution.

## Exceptions

Standards meet most cases, not all. To deviate from a SHOULD or SHOULD NOT, you MUST state the reason inline at the deviation and the reviewer MUST accept it in the PR.

To deviate from a MUST or MUST NOT, you MUST open an issue proposing a change to the rule itself. A MUST is not waived in a PR comment. Either the rule changes for everyone, or the code complies.

Exception comments MUST follow this shape so they are greppable:

```
// SHOULD-EXCEPTION(<file-or-topic>): <reason>. Approved by @<reviewer> in PR #<n>.
```

A rule that accumulates many exceptions is a signal the rule is wrong. Open an issue to revise it.

## Definition of done

A change is done only when all of the following hold. A reviewer MUST NOT approve a PR that fails any item.

- [ ] Code complies with every MUST and MUST NOT in the files relevant to the change.
- [ ] Every SHOULD deviation carries an inline justification accepted by the reviewer.
- [ ] Lint and format pass with zero warnings (see [`tooling/lint-format.md`](./tooling/lint-format.md)).
- [ ] Type check passes with no new errors and no new `// @ts-expect-error` without a linked issue.
- [ ] Tests required by [`testing.md`](./testing.md) exist and pass in CI.
- [ ] CI gates for performance, accessibility, and security pass (see those files).
- [ ] User-facing changes meet the loading, empty, and error state requirements in [`code/components.md`](./code/components.md).

## Glossary

| Term             | Meaning in these standards                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| **Stack A**      | The Next.js 16 App Router application.                                             |
| **Stack B**      | The Vite + React + TanStack Router application.                                    |
| **Stack C**      | The React Native + Expo mobile application.                                        |
| **Registry**     | The custom component registry built on shadcn/ui. The source of UI primitives.     |
| **Boundary**     | A point where untrusted data enters the app (network, form, URL, storage, file).   |
| **Server state** | Data owned by the server and cached on the client (TanStack Query, fetch cache).   |
| **Client state** | UI state owned entirely by the client (Zustand, Jotai).                            |
| **Feature**      | A user-facing slice of functionality, the unit of the view-layer folder structure. |
| **Domain**       | A data concept (User, Order), the unit of the data-layer folder structure.         |
| **CI gate**      | An automated check that blocks merge on failure.                                   |
