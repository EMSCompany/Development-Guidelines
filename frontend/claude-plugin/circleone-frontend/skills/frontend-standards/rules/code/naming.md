> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/naming.md

# Naming

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first.

## Files

- All filenames MUST be kebab-case, including component files. The PascalCase lives in the identifier, not the filename.
- A file exporting one component MUST be named after that component in kebab-case.
- Exception: framework-reserved filenames keep their required names (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `__root.tsx`, `routeTree.gen.ts`).


## Components

- Component identifiers MUST be PascalCase.
- The identifier MUST match the kebab-case filename word-for-word.



## Hooks

- Hook names MUST start with `use` followed by PascalCase.
- A function that calls hooks MUST itself be a hook (named `useX`). MUST NOT hide hook calls inside a non-`use` helper.


## Booleans

- Boolean variables, props, and state MUST read as a yes/no question: prefix with `is`, `has`, `should`, or `can`.
- MUST NOT name a boolean after the thing it gates without a prefix (`open`, `disabled` as local state).



## Event handlers

- Handler props MUST be named `onX` (`onClick`, `onSelect`, `onOrderCreate`).
- Internal handler functions MUST be named `handleX` (`handleClick`, `handleSubmit`).
- The two MUST line up: an `onX` prop is wired to a `handleX` function.



## Constants

- Module-level true constants (fixed, compile-time, never reassigned) MUST be SCREAMING_SNAKE_CASE.
- Configuration objects and derived values use the normal variable convention (camelCase), not SCREAMING_SNAKE_CASE.



## Types

- Type and interface names MUST be PascalCase.
- MUST NOT use Hungarian prefixes: no `I` prefix on interfaces, no `T` prefix on types.
- Props types MUST be `XProps`; Zod-derived form value types MUST be `XValues` (see [`forms.md`](./forms.md)).



## Generics

- A single generic parameter MAY be `T`.
- With more than one generic parameter, names MUST be descriptive (`TData`, `TError`, `TValue`), not `T`, `U`, `V`.


