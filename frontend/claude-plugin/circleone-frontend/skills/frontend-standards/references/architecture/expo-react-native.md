# Architecture: Expo + React Native (Stack C)

Rules for the React Native + Expo + TypeScript mobile application. Stack A has its own file at [`nextjs.md`](./nextjs.md), Stack B at [`vite-react.md`](./vite-react.md). Read [`../conventions.md`](../conventions.md) first.

This stack targets iOS and Android via Expo (with Expo Router). Server state is owned by TanStack Query. Web output via `react-native-web` MAY exist as a dev convenience but is not a production target; if a project needs production web, that is a change to these standards, not a per-PR exception.

## Required folder layout

The view layer is organized by feature. The data layer is organized by domain. Routes are file-based and owned by Expo Router. A full tree is at the end of this file.

- App code MUST live under `src/`. Expo Router reads routes from `src/app/`.
- `src/app/` is routes-only: every file in it becomes a route. Route files MUST stay thin: param reading, layout config, and composition only. Logic lives in `features/` or `domains/`.
- A feature MUST NOT import another feature's internals. Cross-feature sharing goes through `shared/` or the relevant domain.
- Path alias `@` MUST resolve to `src/` and MUST be declared in `tsconfig.json`.

## Expo Router

- Routing MUST be file-based via files in `src/app/`. MUST NOT register screens by hand with bare React Navigation navigators; layouts (`_layout.tsx`) own Stack/Tabs configuration.
- Typed routes MUST be enabled (`experiments.typedRoutes: true` in app config). Navigation MUST use the typed `Link` / `router` APIs. MUST NOT build route strings by hand.
- Route params arrive as strings. Dynamic-route params and search params MUST be validated with a Zod schema before use. MUST NOT pass a raw `useLocalSearchParams()` value into a domain call.
- Route groups `(group)` are for sharing or splitting layouts only. A route group MUST NOT change the public path.
- Every navigator level that can miss MUST be covered by a `+not-found.tsx`; the root layout MUST provide an error boundary.

```tsx
// ✅ Thin route: validate params, render the feature screen
// src/app/(tabs)/orders/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { orderParamsSchema } from "@/domains/order/schema";
import { OrderDetail } from "@/features/orders/order-detail";

export default function OrderRoute() {
  const { id } = orderParamsSchema.parse(useLocalSearchParams());
  return <OrderDetail id={id} />;
}
```

```tsx
// ❌ Raw params trusted, data fetching and business logic inline in the route file
export default function OrderRoute() {
  const { id } = useLocalSearchParams(); // string | string[], unvalidated
  const [order, setOrder] = useState(null);
  useEffect(() => {
    fetch(`${API}/orders/${id}`).then((r) => r.json()).then(setOrder);
  }, [id]);
}
```

## TanStack Query

TanStack Query owns all server state. There is no route loader in this stack, so queries are the single entry point for remote data.

- One `QueryClient` MUST be created in `shared/lib/query-client.ts` and provided once in the root layout. MUST NOT create per-screen clients.
- `onlineManager` MUST be wired to NetInfo and `focusManager` to `AppState` so refetch-on-reconnect and refetch-on-focus work on native. Without this wiring those defaults silently do nothing.
- Query definitions MUST be `queryOptions` factories in the owning domain's `queries.ts`. Components consume them with `useQuery` / `useSuspenseQuery`. MUST NOT inline ad-hoc query keys in components.
- Mutations live in the owning domain's `mutations.ts` and MUST invalidate or update the affected queries on success.
- Screen-critical data SHOULD be read with `useSuspenseQuery` inside a `<Suspense>` + error boundary; secondary or paginated data MAY use `useQuery`.
- MUST NOT fetch server data with bare `fetch` + `useState` + `useEffect` in a component. All remote reads go through the query cache.

```ts
// ✅ One client, native managers wired
// src/shared/lib/query-client.ts
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient, onlineManager, focusManager } from "@tanstack/react-query";

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(!!state.isConnected)),
);

AppState.addEventListener("change", (status) =>
  focusManager.setFocused(status === "active"),
);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});
```

```ts
// ✅ Domain-owned queryOptions factory
// src/domains/order/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getOrder } from "./api";

export const orderQuery = (id: string) =>
  queryOptions({ queryKey: ["order", id], queryFn: () => getOrder(id) });
```

```tsx
// ❌ Ad-hoc key in a component, no domain ownership, no reconnect behavior
useQuery({ queryKey: ["data", id], queryFn: () => fetch(url).then((r) => r.json()) });
```

## Platform-specific code

- Small differences MUST use `Platform.select` / `Platform.OS` inline. Larger differences MUST split into platform files (`chart.tsx` + `chart.ios.tsx` / `chart.android.tsx`), imported extension-free.
- Platform variants of a component MUST share an identical props contract.
- A default file (no platform extension) MUST exist for every split component.

## Env var conventions

- Only variables prefixed `EXPO_PUBLIC_` are inlined into client code. MUST NOT expect a non-`EXPO_PUBLIC_` variable to exist at runtime.
- MUST NOT put secrets in any `EXPO_PUBLIC_` variable. Everything with the prefix ships in the app binary and is extractable (see [`../security.md`](../security.md)). Secrets belong on the backend.
- Env MUST be read through one validated module, parsed with Zod at startup. MUST NOT scatter raw `process.env` reads. References MUST be static (`process.env.EXPO_PUBLIC_X`) — the bundler inlines them at build time, so dynamic access returns `undefined`.

```ts
// ✅ One validated entry point; static references so the bundler can inline
// src/config/env.ts
import { z } from "zod";
const schema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
});
export const env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
});
```

```ts
// ❌ Secret in a client-inlined var, plus dynamic access the bundler cannot inline
const key = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY; // ships in every binary
const url = process.env["EXPO_PUBLIC_" + name]; // undefined at runtime
```

## Native projects and app config

This stack uses Continuous Native Generation: the `android/` and `ios/` directories are build artifacts.

- `android/` and `ios/` MUST NOT be committed and MUST NOT be edited by hand. Regenerate with `npx expo prebuild`.
- Native configuration (name, scheme, icons, permissions, plugins) MUST live in `app.json` / `app.config.ts`. Native customization beyond that MUST go through config plugins.
- Builds and store submissions MUST go through EAS with profiles defined in `eas.json` (`development`, `preview`, `production`).
- Native modules MUST come from the Expo SDK or config-plugin-compatible libraries. Adding a library that requires manually editing native projects is a change to these standards, not a per-PR exception.

## Forbidden patterns

- MUST NOT commit or hand-edit `android/` / `ios/`.
- MUST NOT register screens with bare React Navigation alongside Expo Router.
- MUST NOT read route params without Zod validation.
- MUST NOT fetch server data outside TanStack Query.
- MUST NOT expose secrets through `EXPO_PUBLIC_` variables.
- MUST NOT store tokens in `AsyncStorage`; use `expo-secure-store` (see [`../security.md`](../security.md)).

## Sample folder structure

View layer by feature, data layer by domain, routes owned by Expo Router.

```
src/
  app/                       # Expo Router routes ONLY (thin)
    _layout.tsx              # root: QueryClientProvider, theme, error boundary
    +not-found.tsx
    (auth)/                  # unauthenticated group, own layout
      _layout.tsx
      sign-in.tsx
    (tabs)/                  # authed tab shell
      _layout.tsx            # Tabs config
      index.tsx              # home tab
      orders/
        index.tsx            # /orders
        [id].tsx             # /orders/:id, Zod-validated params

  features/                  # VIEW layer, grouped by feature
    orders/
      order-detail.tsx       # screen body rendered by app/(tabs)/orders/[id].tsx
      order-list.tsx
      use-order-filters.ts   # local UI state/hooks

  domains/                   # DATA layer, grouped by domain
    order/
      api.ts                 # raw fetch calls against the API
      queries.ts             # queryOptions factories (orderQuery)
      mutations.ts           # useMutation fns + invalidation
      schema.ts              # Zod schemas (incl. route params)
      types.ts               # types derived from schema

  shared/                    # cross-feature primitives only
    components/
      ui/                    # design-system primitives (RN components)
    lib/
      query-client.ts        # QueryClient + NetInfo/AppState manager wiring

  config/
    env.ts                   # Zod-validated EXPO_PUBLIC_* env

assets/                      # icons, splash, fonts
app.config.ts                # app config, typedRoutes, config plugins
eas.json                     # EAS build profiles
                             # android/ and ios/ are generated — never committed
```
