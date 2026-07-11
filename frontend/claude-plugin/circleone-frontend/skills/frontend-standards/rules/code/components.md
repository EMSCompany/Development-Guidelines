> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/components.md

# Components

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. Naming details live in [`naming.md`](./naming.md); the full memoization rule lives in [`../performance.md`](../performance.md).

## File-per-component and exports

- One component per file. Filename is kebab-case; the component identifier is PascalCase.
- Use named exports. MUST NOT use default exports for components.
- Exception: Stack A route files (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`) MUST use default exports, because Next.js requires it.



## Component categories

Every component belongs to one of four buckets. Import direction flows one way: `page` -> `feature` -> `ui`, with `layout` alongside.

- **`ui/`**: registry primitives and presentational components. No app data, no stores, no queries. Props in, markup out.
- **`feature/`**: feature-aware components. MAY read state and server data, compose `ui/` pieces.
- **`layout/`**: structural shells (headers, sidebars, page frames). Composition only.
- **page**: route entry. Thin. Composes features and wires data.

Rules:

- A `ui/` component MUST NOT import from `feature/`, read a store, or call a query hook.
- A page MUST NOT contain business logic or markup that belongs in a feature.


## Props

- Props MUST be typed with a `type` named `XProps`. Destructure in the signature.
- MUST NOT spread an unknown object onto a DOM element. Spread only an explicit, typed rest for registry pass-through.
- Boolean props default to `false`. Name them so the default reads correctly (see [`naming.md`](./naming.md)).



## children over render props

- Prefer `children` for composition. Reach for a render prop only when the child needs arguments the parent computes.


## Conditional rendering

- Use `&&` only with a real boolean. MUST NOT use `&&` on a number or string; `0` and `""` render as themselves.
- Use a ternary returning `null` for either/or. Extract to a variable or early return when nesting grows past one level.



## Memoization

Default: do not memoize. The full rule and thresholds live in [`../performance.md`](../performance.md).

- `memo`, `useMemo`, and `useCallback` are allowed only with a measured performance reason or a referential-stability contract (a value passed to an effect dependency list or a context provider).
- MUST NOT add memoization "to be safe."



## Lists, keys, stable identity

- Keys MUST be stable domain IDs. MUST NOT use the array index, except for a provably static list that never reorders, filters, or inserts.
- MUST NOT generate keys at render (`Math.random()`, `crypto.randomUUID()` inside `map`).



## Inline event handlers

- Inline arrow handlers are allowed.
- Extract to a named `handleX` function when the body exceeds one or two lines or is reused.


## Required states

- A component that loads async data MUST handle three states explicitly: loading, empty, and error. Empty is distinct from loading.



## Error boundary placement

Place boundaries where a failure should be contained, not on every component.

- MUST NOT wrap every component in its own error boundary.
- Independently-failing widgets (a chart, a third-party embed) SHOULD get their own boundary so one failure does not take down the route.

### Stack A

- Rely on route `error.tsx` for segment-level failures (see [`../architecture/nextjs.md`](../architecture/nextjs.md)). Add a component-level boundary only around an independently-failing widget.

### Stack B

- Provide a root boundary in `__root.tsx`. Add component-level boundaries only around independently-failing widgets.

