> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/architecture/nextjs.md

# Architecture: Next.js (Stack A)

Rules for the Next.js 16 App Router application. Stack B has its own file at [`vite-react.md`](./vite-react.md), Stack C at [`expo-react-native.md`](./expo-react-native.md). Read [`../conventions.md`](../conventions.md) first.

## Required folder layout

The view layer is organized by feature. The data layer is organized by domain. A full tree is at the end of this file.

- Route files (`page.tsx`, `layout.tsx`, `route.ts`) MUST stay thin. Logic lives in `features/` or `domains/`, not in route files.
- A feature MUST NOT import another feature's internals. Cross-feature sharing goes through `shared/` or the relevant domain.

## Route groups

- Use route groups `(group)` only to share or split a layout. MUST NOT use them for URL cosmetics.
- A route group MUST NOT change the public URL.

## Server vs Client components

- Default to Server Components. Add `'use client'` only for state, effects, browser APIs, or event handlers.
- Push `'use client'` to the leaf. Keep data fetching and composition in Server Components above it.
- MUST NOT add `'use client'` to a file only because a child needs it.
- MUST NOT put `'use client'` in `layout.tsx`.

## Server Actions

- Use Server Actions for mutations (create, update, delete). MUST NOT use them for reads a Server Component or Route Handler can do.
- MUST validate every input with Zod at the top of the action (see [`../security.md`](../security.md)).
- MUST authorize inside the action. Never trust the client to gate it.
- After a successful mutation, MUST revalidate affected data with the two-argument `revalidateTag(tag, 'max')` or `revalidatePath`.

## Caching defaults

This app runs `cacheComponents: true`. Nothing is cached unless explicitly marked.

- `next.config.ts` MUST set `cacheComponents: true`.
- Cache data with `'use cache'` plus an explicit `cacheLife` profile. MUST NOT rely on implicit defaults.
- MUST tag cached data with `cacheTag` so mutations can target it.
- Wrap per-request or per-user work in `<Suspense>`. MUST NOT cache it.

## Required boundaries

- Every route segment that fetches data MUST provide `loading.tsx` and `error.tsx`.
- Every dynamic segment that can 404 MUST provide `not-found.tsx` and call `notFound()` on missing data.
- `error.tsx` MUST be a Client Component and MUST expose retry via `reset`.
- The root `app/` MUST have a global `error.tsx` and `not-found.tsx`.
- When we fetch data in the component we should always have loading, 0 output and error state ui returns.

## Proxy (`proxy.ts`)

- Request interception MUST live in `proxy.ts` with an exported `proxy` function.
- Proxy MAY: redirect, rewrite, mutate headers, gate auth coarsely, route locales. MUST NOT contain business logic, data mutations, or work belonging in a Server Action or Route Handler.
- MUST NOT rely on `fetch` caching inside proxy. Fetches there are always uncached.
- MUST NOT depend on shared modules or globals; proxy may be deployed separately at the network boundary.

## Metadata

- Every `page.tsx` MUST export `metadata` or `generateMetadata` with at least `title` and `description`.
- Dynamic pages MUST use `generateMetadata` driven by the fetched entity, not hardcoded strings.
- The root layout MUST set `metadataBase`, a default title template, and Open Graph defaults.

## Forbidden patterns

- MUST NOT fetch in a Client Component what a Server Component can fetch.
- MUST NOT use route segment config (`export const dynamic`, `revalidate`, `fetchCache`) to work around caching. Use `'use cache'` and `<Suspense>` instead.
- MUST NOT read secrets in client code or expose non-`NEXT_PUBLIC_` env to the client (see [`../security.md`](../security.md)).
- MUST NOT swallow errors to hide them from the nearest `error.tsx`.

## Cross-cutting concerns

- **Logging.** Server logs MUST go through the shared logger. MUST NOT log PII, tokens, or full request/response payloads.
- **Errors.** Expected failures return typed results. Unexpected failures throw to the nearest `error.tsx`. MUST NOT catch-and-ignore.
- **Env.** Access env through one validated config module, parsed with Zod at startup. MUST NOT scatter raw `process.env` reads.

## Sample folder structure

View layer by feature, data layer by domain.

```
app/
  layout.tsx                 # root: metadataBase, title template, OG defaults
  error.tsx                  # global error boundary (client)
  not-found.tsx              # global 404
  (app)/                     # authed shell
    layout.tsx
    orders/
      page.tsx               # thin: composes features
      loading.tsx
      error.tsx
      [id]/
        page.tsx
        not-found.tsx
  (marketing)/               # marketing shell
    pricing/page.tsx

features/                    # VIEW layer, grouped by feature
  orders/
    order-list.tsx
    order-table.tsx
    refresh-button.tsx       # 'use client' leaf
    use-order-filters.ts     # local UI state/hooks

domains/                     # DATA layer, grouped by domain
  order/
    queries.ts               # 'use cache' reads, cacheTag
    mutations.ts             # server actions
    schema.ts                # Zod schemas
    types.ts                 # types derived from schema
  auth/
    server.ts                # requireUser, session helpers

shared/                      # cross-feature primitives only
  components/
    ui/                      # registry components
  lib/

config/
  env.ts                     # Zod-validated env

proxy.ts                     # network boundary (Node runtime)
next.config.ts               # cacheComponents: true
```
