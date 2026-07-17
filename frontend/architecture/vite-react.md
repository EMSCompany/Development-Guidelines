# Architecture: Vite + React (Stack B)

Rules for the Vite + React + TanStack Router application. Stack A has its own file at [`nextjs.md`](./nextjs.md), Stack C at [`expo-react-native.md`](./expo-react-native.md). Read [`../conventions.md`](../conventions.md) first.

This stack is a client-side SPA. TanStack Start (SSR, server functions) is out of scope here; if a project needs it, that is a change to these standards, not a per-PR exception.

## Required folder layout

The view layer is organized by feature. The data layer is organized by domain. Routes are file-based and owned by TanStack Router. A full tree is at the end of this file.

- Route files in `src/routes/` MUST stay thin: route config, loader wiring, and composition only. Logic lives in `features/` or `domains/`.
- `routeTree.gen.ts` is generated. MUST be committed and MUST NOT be edited by hand.
- A feature MUST NOT import another feature's internals. Cross-feature sharing goes through `shared/` or the relevant domain.

## TanStack Router

- Routing MUST be file-based via `createFileRoute`. MUST NOT hand-build route trees with `createRoute` chains.
- Route search params MUST be validated with `validateSearch` using a Zod schema. MUST NOT read raw `window.location.search`.
- Navigation MUST use the typed `Link` / `useNavigate`. MUST NOT build route strings by hand.

```tsx
// ✅ File-based route with validated search params
// src/routes/orders.tsx
import { createFileRoute } from "@tanstack/react-router";
import { orderSearchSchema } from "@/domains/order/schema";

export const Route = createFileRoute("/orders")({
  validateSearch: orderSearchSchema,
  component: OrdersPage,
});
```

```tsx
// ❌ Untyped search access, hand-built link target
const status = new URLSearchParams(window.location.search).get("status");
navigate({ to: `/orders?status=${status}` });
```

## Loader vs component data fetching

Loaders are the entry point for route-critical data. They hydrate the TanStack Query cache so the component reads from one source.

- Route-critical data (data the route cannot render without) MUST be initiated in the route `loader` via `queryClient.ensureQueryData`. The component reads it with `useSuspenseQuery`.
- Secondary, interaction-driven, or paginated data MAY be fetched in-component with `useQuery`.
- MUST NOT fetch route-critical data only inside `useEffect`. That reintroduces waterfalls and loses preloading.

```tsx
// ✅ Loader primes the cache; component reads via Suspense query
// src/routes/orders.$id.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orderQuery } from "@/domains/order/queries";

export const Route = createFileRoute("/orders/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orderQuery(params.id)),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(orderQuery(id));
  return <OrderDetail order={data} />;
}
```

```tsx
// ❌ Critical data fetched in an effect: waterfall, no preload, manual loading state
function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    getOrder(id).then(setOrder);
  }, [id]);
  if (!order) return <Spinner />;
}
```

## Code splitting

- The router bundler plugin MUST set `autoCodeSplitting: true`. MUST NOT scatter manual `lazyRouteComponent` calls when auto-splitting covers the case.
- MUST NOT split the route `loader` into its own chunk. The loader is a preload asset and belongs in the main bundle.
- Large, rarely-used, non-route chunks (heavy editors, charts) SHOULD be lazied with `React.lazy` + `<Suspense>` (size threshold in [`../performance.md`](../performance.md)).

```ts
// ✅ Auto code-splitting on; loader stays unsplit (plugin default)
tanstackRouter({ autoCodeSplitting: true });
```

```ts
// ❌ Forcing the loader into its own chunk: double async cost on navigation
tanstackRouter({
  autoCodeSplitting: true,
  codeSplittingOptions: { defaultBehavior: [["loader"], ["component"]] },
});
```

## Env var conventions

- Only variables prefixed `VITE_` are exposed to client code. MUST NOT expect a non-`VITE_` variable to exist in the browser.
- MUST NOT put secrets in any `VITE_` variable. Everything prefixed `VITE_` ships in the bundle (see [`../security.md`](../security.md)).
- Env MUST be read through one validated module, parsed with Zod at startup. MUST NOT scatter raw `import.meta.env` reads.

```ts
// ✅ One validated entry point
// src/config/env.ts
import { z } from "zod";
const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_SENTRY_DSN: z.string().optional(),
});
export const env = schema.parse(import.meta.env);
```

```ts
// ❌ Secret in a client-exposed var, read raw and unvalidated
const key = import.meta.env.VITE_STRIPE_SECRET_KEY; // shipped to every browser
```

## Vite config conventions

- The `tanstackRouter` plugin MUST be registered before `@vitejs/plugin-react`. Order is required for codegen.
- Path alias `@` MUST resolve to `src/`. The same alias MUST exist in `tsconfig` and `vite.config.ts`.
- Build-affecting config (aliases, plugins, env handling) MUST live in `vite.config.ts`, not be duplicated per entry point.

```ts
// ✅ vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    react(), // after the router plugin
  ],
  resolve: { alias: { "@": "/src" } },
});
```

## Forbidden patterns

- MUST NOT edit `routeTree.gen.ts` by hand.
- MUST NOT use a second routing library (React Router, wouter) alongside TanStack Router.
- MUST NOT read or mutate URL state outside the router's typed APIs.
- MUST NOT fetch route-critical data in `useEffect` (use a loader).
- MUST NOT expose secrets through `VITE_` variables.

## Sample folder structure

View layer by feature, data layer by domain, routes owned by the router.

```
src/
  main.tsx                   # app entry, router + QueryClient providers
  router.tsx                 # createRouter, context: { queryClient }
  routeTree.gen.ts           # GENERATED, committed, never hand-edited

  routes/                    # file-based routes (thin)
    __root.tsx               # root layout, error + not-found boundaries
    index.tsx
    orders.tsx               # /orders, validateSearch
    orders.$id.tsx           # /orders/:id, loader -> ensureQueryData

  features/                  # VIEW layer, grouped by feature
    orders/
      order-detail.tsx
      order-table.tsx
      use-order-filters.ts   # local UI state/hooks

  domains/                   # DATA layer, grouped by domain
    order/
      queries.ts             # queryOptions factories (orderQuery)
      mutations.ts           # mutation fns + invalidation
      schema.ts              # Zod schemas (incl. search params)
      types.ts               # types derived from schema

  shared/                    # cross-feature primitives only
    components/
      ui/                    # registry components
    lib/

  config/
    env.ts                   # Zod-validated import.meta.env
```
