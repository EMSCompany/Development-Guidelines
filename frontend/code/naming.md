# Naming

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first.

## Files

- All filenames MUST be kebab-case, including component files. The PascalCase lives in the identifier, not the filename.
- A file exporting one component MUST be named after that component in kebab-case.
- Exception: framework-reserved filenames keep their required names (`page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `__root.tsx`, `routeTree.gen.ts`).

```
✅ loyalty-cta-section.tsx   ->  export function LoyaltyCtaSection()
✅ use-order-filters.ts      ->  export function useOrderFilters()
✅ format-currency.ts        ->  export function formatCurrency()
❌ LoyaltyCtaSection.tsx
❌ loyaltyCtaSection.tsx
```

## Components

- Component identifiers MUST be PascalCase.
- The identifier MUST match the kebab-case filename word-for-word.

```tsx
// ✅ file: loyalty-club-page.tsx
const LoyaltyClubPage = () => {
  return <main>...</main>;
};
export { LoyaltyClubPage };
```

```tsx
// ❌ identifier does not match filename
// file: loyalty-club-page.tsx
const LoyaltyPage = () => {};
```

## Hooks

- Hook names MUST start with `use` followed by PascalCase.
- A function that calls hooks MUST itself be a hook (named `useX`). MUST NOT hide hook calls inside a non-`use` helper.

```ts
// ✅
function useOrderFilters() {}

// ❌ calls useState but is not named as a hook
function getOrderFilters() {
  const [state] = useState();
}
```

## Booleans

- Boolean variables, props, and state MUST read as a yes/no question: prefix with `is`, `has`, `should`, or `can`.
- MUST NOT name a boolean after the thing it gates without a prefix (`open`, `disabled` as local state).

```ts
// ✅
const isOpen = false;
const hasAccess = true;
const shouldRetry = attempts < max;
```

```ts
// ❌
const open = false;
const access = true;
```

## Event handlers

- Handler props MUST be named `onX` (`onClick`, `onSelect`, `onOrderCreate`).
- Internal handler functions MUST be named `handleX` (`handleClick`, `handleSubmit`).
- The two MUST line up: an `onX` prop is wired to a `handleX` function.

```tsx
// ✅ prop is onX, internal is handleX
type Props = { onSave: (id: string) => void };
function OrderRow({ onSave }: Props) {
  const handleSave = () => onSave(order.id);
  return <button onClick={handleSave}>Save</button>;
}
```

```tsx
// ❌ mismatched conventions
type Props = { handleSave: () => void }; // prop should be onSave
function OrderRow({ handleSave }: Props) {
  const onClickSave = () => handleSave();
}
```

## Constants

- Module-level true constants (fixed, compile-time, never reassigned) MUST be SCREAMING_SNAKE_CASE.
- Configuration objects and derived values use the normal variable convention (camelCase), not SCREAMING_SNAKE_CASE.

```ts
// ✅
const MAX_RETRIES = 3;
const DEFAULT_PAGE_SIZE = 20;
const apiClient = createClient(env.VITE_API_URL); // not a constant in this sense
```

```ts
// ❌
const maxRetries = 3; // fixed constant should be SCREAMING_SNAKE_CASE
const API_CLIENT = createClient(); // runtime value, not a literal constant
```

## Types

- Type and interface names MUST be PascalCase.
- MUST NOT use Hungarian prefixes: no `I` prefix on interfaces, no `T` prefix on types.
- Props types MUST be `XProps`; Zod-derived form value types MUST be `XValues` (see [`forms.md`](./forms.md)).

```ts
// ✅
type User = { id: string };
type OrderRowProps = { order: Order };
interface ButtonProps {}
```

```ts
// ❌
interface IUser {}
type TOrder = {};
```

## Generics

- A single generic parameter MAY be `T`.
- With more than one generic parameter, names MUST be descriptive (`TData`, `TError`, `TValue`), not `T`, `U`, `V`.

```ts
// ✅ one is fine as T; multiple must describe
function identity<T>(value: T): T {
  return value;
}
function useQuery<TData, TError>(): Result<TData, TError> {}
```

```ts
// ❌ multiple opaque single letters
function useQuery<T, U>(): Result<T, U> {}
```
