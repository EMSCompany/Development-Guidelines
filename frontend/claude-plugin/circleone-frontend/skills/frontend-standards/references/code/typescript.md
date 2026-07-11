# TypeScript

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. Lint enforcement lives in [`../tooling/lint-format.md`](../tooling/lint-format.md).

## Required tsconfig flags

These compiler options MUST be set. A project MUST NOT relax them locally without a standards change.

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "skipLibCheck": true,
  },
}
```

- `exactOptionalPropertyTypes` SHOULD be enabled. Disable per project only when third-party types make it impractical, documented per the exception process.

## `type` vs `interface`

- Use `type` by default for object shapes, unions, and aliases.
- Reach for `interface` only when you need declaration merging or a cleaner `extends` chain across many shapes.

```ts
// ✅ type by default
type User = { id: string; name: string };
type OrderStatus = "open" | "closed";

// ✅ interface when extending a chain
interface BaseProps {
  className?: string;
}
interface ButtonProps extends BaseProps {
  onClick: () => void;
}
```

```ts
// ❌ interface for a one-off shape or a union (unions can't be interfaces)
interface User {
  id: string;
  name: string;
}
```

## `any`

- MUST NOT use `any`.
- Where a third-party gap forces it, MUST isolate it behind a typed wrapper and MUST annotate with a justified `eslint-disable-next-line`.

```ts
// ✅ Isolated, justified, returns a real type
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- vendor SDK ships no types
function parseVendorPayload(raw: any): User {
  return userSchema.parse(raw);
}
```

```ts
// ❌ any leaks into the codebase
function handle(data: any) {
  return data.user.name; // no safety past this point
}
```

## `unknown` over `any`

- Untrusted input (network, storage, `JSON.parse`, message events) MUST be typed `unknown` and narrowed before use.
- Narrowing at a boundary MUST go through a Zod schema, not manual casts (see [`../security.md`](../security.md)).

```ts
// ✅ unknown in, validated out
async function getUser(id: string): Promise<User> {
  const raw: unknown = await api.get(`/users/${id}`);
  return userSchema.parse(raw);
}
```

```ts
// ❌ any in, trusted blindly
async function getUser(id: string): Promise<User> {
  const raw: any = await api.get(`/users/${id}`);
  return raw;
}
```

## `enum`

- MUST NOT use `enum`. Use a `const` object with `as const` and a derived union type.
- Reason: `enum` emits runtime code, has surprising numeric behavior, and is not a plain value.

```ts
// ✅ const object + derived type
const OrderStatus = {
  Open: "open",
  Closed: "closed",
} as const;
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
```

```ts
// ❌ enum
enum OrderStatus {
  Open,
  Closed,
}
```

## Non-null assertion (`!`)

- SHOULD NOT use `!` to silence a possibly-`undefined` value. Narrow with a guard instead.
- MUST NOT use `!` to defeat `noUncheckedIndexedAccess` on array or record access.
- MAY use `!` in test setup where a fixture is provably present.

```ts
// ✅ Guard, then use
const first = items[0];
if (!first) return;
process(first);
```

```ts
// ❌ Assertion hides a real undefined
process(items[0]!);
const el = document.querySelector(".x")!; // throws at runtime if absent
```

## Type assertion (`as`)

- MUST NOT use `as` to force-fit unrelated types or bypass a real type error.
- MUST NOT use the `as unknown as T` double assertion.
- `as const` is encouraged. `as` to narrow `unknown` is allowed only after a runtime check.

```ts
// ✅ as const, and a checked narrow
const config = { mode: "dark" } as const;
if (typeof value === "string") {
  const s = value as string; // redundant but harmless; prefer letting inference work
}
```

```ts
// ❌ Lying to the compiler
const user = {} as User; // missing every field, no error until runtime
const n = "5" as unknown as number;
```

## Return type annotations

- Exported non-component functions MUST declare an explicit return type. It pins the contract and prevents accidental widening.
- React components are exempt; the JSX return type is inferred.
- Internal (non-exported) functions MAY rely on inference.

```ts
// ✅ Exported function, explicit return
export function getDiscount(order: Order): number {
  return order.total * 0.1;
}

// ✅ Component, inferred return is fine
export function OrderBadge({ status }: { status: OrderStatus }) {
  return <span>{status}</span>;
}
```

```ts
// ❌ Exported, inferred return can widen or drift silently
export function getDiscount(order: Order) {
  return order.total * 0.1;
}
```

## Discriminated unions for variants

- A type with mutually exclusive variants MUST be a discriminated union with a literal tag. MUST NOT model variants with optional fields or boolean flags.
- Reason: the tag lets the compiler narrow each branch and flags unhandled cases.

```ts
// ✅ Tagged union; each branch carries only its own fields
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User }
  | { status: "error"; error: string };

function render(state: RequestState) {
  switch (state.status) {
    case "success":
      return state.data.name; // data is known to exist here
    case "error":
      return state.error;
  }
}
```

```ts
// ❌ Optional fields: every combination is "valid", none is guaranteed
type RequestState = {
  isLoading?: boolean;
  data?: User;
  error?: string;
};
```
