> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/components.md

# Components

Applies to all three stacks. Read [`../conventions.md`](../conventions.md) first. Naming details live in [`naming.md`](./naming.md); the full memoization rule lives in [`../performance.md`](../performance.md).

## File-per-component and exports

- One component per file. Filename is kebab-case; the component identifier is PascalCase. The parts of a compound component are the one exception (see [Component structure](#component-structure)).
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

## Component structure

Categories say where a component lives. Structure says how its API is shaped, and there are two shapes. Every component is one of them. The two axes are independent: a `ui/` primitive and a `feature/` component can each be either.

- **Compound**: a root plus named parts, exported together and composed by the caller (`Card`, `CardHeader`, `CardContent`). The caller decides which parts exist and in what order.
- **Unitary**: a single component with a fixed internal arrangement, configured by props. The component decides the layout; the caller fills it in.

Rules:

- A component whose internal arrangement varies between call sites MUST be compound.
- A component whose arrangement is the same everywhere it is used SHOULD be unitary. Splitting a fixed layout into parts moves work to every caller and buys nothing back.
- Behavior does not decide the structure. A compound root MAY own state, effects, and gestures, and share them with its parts through context.
- A vendored registry file MUST be left in the structure the registry ships it in. Adapt it by wrapping, not by flattening a compound into props or splitting a unitary component into parts.

### Signals that a unitary component has outgrown its props

Each of these is the caller asking for reach that the props do not give it. They are countable, which makes them reviewable.

- A component MUST NOT expose more than one `className`-suffixed prop beyond `className` itself. A second one means the caller is styling internals it cannot otherwise address, and those internals MUST become parts.
- A `ReactNode` prop other than `children` is a slot in disguise. Two or more of them SHOULD be parts.
- A boolean prop that adds or removes a whole region (`hideHeader`, `showFooter`) is also a slot in disguise. Two or more of them SHOULD be parts.

### Writing a compound component

- Every part of one compound component MUST live in the root's file. This is the one exception to one component per file: the parts are a single component's API, not separate components.
- Parts MUST be named `<Root><Part>` and exported as named exports alongside the root.
- Parts MUST NOT be attached to the root as properties (`Card.Header = CardHeader`). Flat named exports match the registry and stay statically analyzable.
- A part MUST forward its typed rest props. On Stacks A and B it MUST also accept `className` and merge it last with `cn()`, like any shared component (see [`styling.md`](./styling.md)).
- A part SHOULD render a single element. Structure nested inside a part is structure the caller cannot reach, which is the problem being solved.
- Every part MUST carry `data-slot="<root>-<part>"` in kebab-case.
- Layout that depends on another part MUST be expressed against those slots (`has-data-[slot=card-footer]:pb-0`). The root MUST tolerate an absent part and MUST NOT assert that one was passed.
- State shared between parts MUST travel through a context created by the root.
- MUST NOT inject props into parts with `React.Children.map` and `cloneElement`. It breaks the moment a part is wrapped, reordered, or rendered by the caller's own component.
- A part that reads the root's context MUST throw when rendered outside its root, and the message MUST name the root so the caller knows what to wrap it in.

### Stack C (React Native)

- The composition rules above hold: parts, naming, one file, context, and the `cloneElement` ban. The web styling hooks do not.
- A part MUST still let the caller override its styling last. The prop that carries it is whatever Stack C's styling standard defines, and that standard is not written yet — [`styling.md`](./styling.md) binds Stacks A and B only. Treat it as a gap and open an issue rather than inventing a per-component convention (see [`../conventions.md`](../conventions.md)).
- `data-slot` does not transfer: RN has no DOM attributes and no attribute selectors, so one part cannot be styled by another part's presence.
- Presence-dependent layout MUST come from state the root already owns, or from a part registering itself through the root's context. MUST NOT inspect or clone `children` to detect which parts were passed.

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

