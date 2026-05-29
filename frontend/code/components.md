# Components

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. Naming details live in [`naming.md`](./naming.md); the full memoization rule lives in [`../performance.md`](../performance.md).

## File-per-component and exports

- One component per file. Filename is kebab-case; the component identifier is PascalCase.
- Use named exports. MUST NOT use default exports for components.
- Exception: Stack A route files (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `loading.tsx`) MUST use default exports, because Next.js requires it.

```tsx
// ✅ order-summary.tsx -> PascalCase identifier, named export
export function OrderSummary({ order }: OrderSummaryProps) {
  return <section>{order.reference}</section>;
}
```

```tsx
// ❌ default export, filename/identifier mismatch
// file: OrderSummary.tsx
export default function order_summary() {}
```

## Component categories

Every component belongs to one of four buckets. Import direction flows one way: `page` -> `feature` -> `ui`, with `layout` alongside.

- **`ui/`**: registry primitives and presentational components. No app data, no stores, no queries. Props in, markup out.
- **`feature/`**: feature-aware components. MAY read state and server data, compose `ui/` pieces.
- **`layout/`**: structural shells (headers, sidebars, page frames). Composition only.
- **page**: route entry. Thin. Composes features and wires data.

Rules:

- A `ui/` component MUST NOT import from `feature/`, read a store, or call a query hook.
- A page MUST NOT contain business logic or markup that belongs in a feature.

```tsx
// ❌ ui/ primitive reaching into app data
// ui/badge.tsx
import { useOrderStore } from "@/features/orders/store"; // forbidden in ui/
export function Badge() {
  const count = useOrderStore((s) => s.count);
  return <span>{count}</span>;
}
```

## Props

- Props MUST be typed with a `type` named `XProps`. Destructure in the signature.
- MUST NOT spread an unknown object onto a DOM element. Spread only an explicit, typed rest for registry pass-through.
- Boolean props default to `false`. Name them so the default reads correctly (see [`naming.md`](./naming.md)).

```tsx
// ✅ Named props type, explicit rest forwarded to a registry primitive
type IconButtonProps = {
  label: string;
} & React.ComponentProps<typeof Button>;

export function IconButton({ label, ...rest }: IconButtonProps) {
  return <Button aria-label={label} {...rest} />;
}
```

```tsx
// ❌ Spreading an unknown object onto the DOM
export function Card(props: Record<string, unknown>) {
  return <div {...props} />; // leaks arbitrary attributes, no type safety
}
```

## children over render props

- Prefer `children` for composition. Reach for a render prop only when the child needs arguments the parent computes.

```tsx
// ✅ children for plain composition
export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded border p-4">{children}</div>;
}

// ✅ render prop only because the child needs the row
export function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

## Conditional rendering

- Use `&&` only with a real boolean. MUST NOT use `&&` on a number or string; `0` and `""` render as themselves.
- Use a ternary returning `null` for either/or. Extract to a variable or early return when nesting grows past one level.

```tsx
// ✅ Real boolean, and a guarded count
{
  isOpen && <Drawer />;
}
{
  items.length > 0 && <List items={items} />;
}
{
  user ? <Profile user={user} /> : <SignIn />;
}
```

```tsx
// ❌ Number left of &&: renders "0" when the list is empty
{
  items.length && <List items={items} />;
}
{
  items.length && <List items={items} />;
} // shows 0
```

## Memoization

Default: do not memoize. The full rule and thresholds live in [`../performance.md`](../performance.md).

- `memo`, `useMemo`, and `useCallback` are allowed only with a measured performance reason or a referential-stability contract (a value passed to an effect dependency list or a context provider).
- MUST NOT add memoization "to be safe."

```tsx
// ✅ Stable identity required: value feeds a context provider
const value = useMemo(() => ({ user, signOut }), [user, signOut]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

```tsx
// ❌ Wrapping a cheap value with no consumer that needs stable identity
const label = useMemo(() => `${user.first} ${user.last}`, [user]);
```

## Lists, keys, stable identity

- Keys MUST be stable domain IDs. MUST NOT use the array index, except for a provably static list that never reorders, filters, or inserts.
- MUST NOT generate keys at render (`Math.random()`, `crypto.randomUUID()` inside `map`).

```tsx
// ✅ Stable domain id
{
  orders.map((order) => <OrderRow key={order.id} order={order} />);
}
```

```tsx
// ❌ Index key on a reorderable list: state attaches to the wrong row
{
  orders.map((order, i) => <OrderRow key={i} order={order} />);
}
```

## Inline event handlers

- Inline arrow handlers are allowed.
- Extract to a named `handleX` function when the body exceeds one or two lines or is reused.

```tsx
// ✅ Inline for trivial, named for real logic
<button onClick={() => setOpen(true)}>Open</button>;

function handleSubmit(values: OrderValues) {
  validate(values);
  mutate(values);
}
```

## Required states

- A component that loads async data MUST handle three states explicitly: loading, empty, and error. Empty is distinct from loading.

```tsx
// ✅ Three states, empty separated from loading
function OrderList() {
  const { data, isPending, isError } = useOrders();
  if (isPending) return <Skeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (data.length === 0) return <EmptyState />;
  return (
    <ul>
      {data.map((o) => (
        <OrderRow key={o.id} order={o} />
      ))}
    </ul>
  );
}
```

```tsx
// ❌ Empty collapsed into loading: a real empty result shows a spinner forever
function OrderList() {
  const { data } = useOrders();
  if (!data?.length) return <Skeleton />;
  return <ul>{/* ... */}</ul>;
}
```

## Error boundary placement

Place boundaries where a failure should be contained, not on every component.

- MUST NOT wrap every component in its own error boundary.
- Independently-failing widgets (a chart, a third-party embed) SHOULD get their own boundary so one failure does not take down the route.

### Stack A

- Rely on route `error.tsx` for segment-level failures (see [`../architecture/nextjs.md`](../architecture/nextjs.md)). Add a component-level boundary only around an independently-failing widget.

### Stack B

- Provide a root boundary in `__root.tsx`. Add component-level boundaries only around independently-failing widgets.

```tsx
// ✅ Contain one risky widget; the rest of the route survives its failure
<Dashboard>
  <Stats />
  <ErrorBoundary fallback={<WidgetError />}>
    <ThirdPartyChart />
  </ErrorBoundary>
</Dashboard>
```
