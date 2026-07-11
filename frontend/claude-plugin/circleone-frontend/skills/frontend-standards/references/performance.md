# Performance

Applies to both stacks. Read [`conventions.md`](./conventions.md) first. The budget numbers here are the contract; CI enforces them (see CI gates). Where a number lives in CI config, the config and this file MUST agree.

## Performance budget

- Core Web Vitals MUST hold at p75 on production field data: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
- Each route's first-load client JS MUST stay ≤ 200 KB gzipped. Total initial transfer (JS + CSS + fonts + above-the-fold images) SHOULD stay ≤ 350 KB gzipped.
- A change that pushes a route past budget MUST NOT merge until it is back under budget, or the budget is raised by an accepted issue. A budget is not raised in a PR comment.
- Lab numbers (Lighthouse) gate merges; field numbers (RUM) are the ground truth the lab numbers stand in for. When they disagree, field wins and the lab threshold is wrong.

## Images

- Every image MUST reserve its space before load: explicit `width`/`height`, or `fill` inside a sized container. Layout MUST NOT shift when an image loads.
- The single above-the-fold hero image MUST load eagerly; every image below the fold MUST lazy-load.
- Source format SHOULD be AVIF or WebP. MUST NOT ship an unoptimized PNG or JPEG over ~100 KB.
- `alt` rules live in [`accessibility.md`](./accessibility.md).

### Stack A

- Raster images MUST use `next/image`. Raw `<img>` is allowed only for: an inline data URI, or an external host that cannot be configured in `next.config`. Each `<img>` MUST carry an exception comment (see [`conventions.md`](./conventions.md)).

```tsx
// ✅ Dimensions reserved, below-fold lazy by default
<Image src={user.avatar} alt="" width={40} height={40} />
```

```tsx
// ❌ Raw img, no dimensions, shifts layout on load
<img src={user.avatar} />
```

### Stack B

- Local images MUST be imported as assets so Vite hashes and optimizes them. MUST NOT reference local images by string path from `public/` when an import works.
- Remote images MUST sit in a sized wrapper and MUST set `loading="lazy"` below the fold.

```tsx
// ✅ Imported asset, dimensions set
import avatar from "@/assets/avatar.png";
<img src={avatar} alt="" width={40} height={40} loading="lazy" />;
```

## Fonts

- Fonts MUST be self-hosted, subset to the glyphs in use, and loaded with `font-display: swap`. MUST NOT load fonts from a third-party stylesheet at runtime (e.g. a Google Fonts `<link>`).
- The primary text font MUST be preloaded, and a fallback with adjusted metrics MUST be declared so swap does not shift layout.

### Stack A

- Fonts MUST be loaded through `next/font` (self-hosting, subsetting, and the fallback metric adjustment are handled for you).

```tsx
// ✅ next/font, self-hosted and swap by default
import { Inter } from "next/font/google";
const inter = Inter({ subset: ["latin"], display: "swap" });
```

### Stack B

- Fonts MUST be self-hosted via the asset pipeline with `@font-face`, `font-display: swap`, and `size-adjust` / `ascent-override` fallback metrics to minimize CLS.

```css
/* ✅ Self-hosted with a metric-adjusted fallback */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-display: swap;
}
@font-face {
  font-family: "Inter Fallback";
  src: local("Arial");
  size-adjust: 107%;
}
```

## Code splitting and dynamic imports

- A component or library that is below the fold, behind interaction, or route-specific and exceeds ~30 KB gzipped MUST be dynamically imported.
- Heavy, rarely-used dependencies (rich-text editors, charting, date pickers, map libraries) MUST NOT sit in the initial bundle.
- Every dynamic import MUST render a loading state and MUST fail into an error boundary, not a blank area.
- Route-level splitting is governed by [`architecture/nextjs.md`](./architecture/nextjs.md) and [`architecture/vite-react.md`](./architecture/vite-react.md). This file governs component-level splitting.

```tsx
// ✅ Heavy editor loaded on demand with a loading state (Stack A)
const Editor = dynamic(() => import("@/features/editor/Editor"), {
  loading: () => <EditorSkeleton />,
});
```

```tsx
// ❌ Heavy editor in the initial bundle, shipped to every visitor
import { Editor } from "@/features/editor/Editor";
```

## Imports and tree-shaking

- A barrel file (an `index.ts` that re-exports a whole directory) MUST NOT be created for component or utility folders. Barrels pull unrelated modules into the bundle and defeat tree-shaking.
- A large library that is not fully tree-shakeable MUST be imported by subpath, not from the package root (lodash, date-fns, icon sets).
- MUST NOT import a whole namespace (`import * as`) from a large library.

```tsx
// ✅ Subpath imports; only what is used ships
import debounce from "lodash/debounce";
import { format } from "date-fns";
```

```tsx
// ❌ Root import drags in the whole library
import { debounce } from "lodash";
import * as dateFns from "date-fns";
```

## Bundle analysis

- A PR that adds or upgrades a runtime dependency MUST run the bundle analyzer and MUST state the first-load KB delta in the description.
- A new dependency MUST be justified against its gzipped cost. Prefer a smaller alternative or a native platform API when the delta is not warranted.
- MUST NOT add a dependency for something achievable in a few lines.
- Stack A uses `@next/bundle-analyzer`; Stack B uses `rollup-plugin-visualizer`.

## Prefetching

- Prefetch is the default for primary in-viewport navigation. MUST NOT prefetch low-value or auth-gated routes that waste bandwidth.

### Stack A

- Internal navigation MUST use `next/link`. Prefetch is on by default; set `prefetch={false}` for rarely-followed links.

### Stack B

- Internal navigation MUST use the router `<Link>`. Heavy routes SHOULD set `preload="intent"` so code and loader data fetch on hover or focus.

```tsx
// ✅ Heavy route preloads on intent (Stack B)
<Link to="/reports/$id" params={{ id }} preload="intent">
  Report
</Link>
```

## Streaming and Suspense (Stack A)

- Slow, non-critical data MUST be wrapped in a `<Suspense>` boundary with a skeleton so the shell streams immediately instead of blocking on the slowest fetch.
- Default to Server Components. A component MUST become a Client Component only for interactivity, browser APIs, or hooks (full rule in [`architecture/nextjs.md`](./architecture/nextjs.md)). Keeping the tree server-side is the primary lever on the client JS budget.
- MUST NOT add `"use client"` at a route or layout root to make something work. Push the boundary down to the smallest interactive leaf.

```tsx
// ✅ Shell streams; slow widget fills in behind a skeleton
<Suspense fallback={<RevenueSkeleton />}>
  <Revenue />
</Suspense>
```

```tsx
// ❌ "use client" at the page root pulls the whole tree client-side
"use client";
export default function DashboardPage() {
  /* ... */
}
```

## Memoization

- `React.memo`, `useMemo`, and `useCallback` MUST NOT be added speculatively. The default is none.
- `useMemo` / `useCallback` MUST be used only when the value or callback is a dependency of another hook, feeds a `memo`-wrapped child, or wraps a measurably expensive computation.
- `React.memo` MUST be used only for a component that re-renders often with reference-stable props and has a measured render cost.
- A memoization kept for performance SHOULD cite the measurement (profiler, benchmark) in a comment. One with no justification is removable in review.
- This is the performance rationale; the component-authoring rule is in [`code/components.md`](./code/components.md). The two MUST NOT conflict.

```tsx
// ✅ Memo earns its place: stable dep feeding a memoized child
const onSelect = useCallback((id: string) => setSelected(id), []);
return <ExpensiveList items={items} onSelect={onSelect} />;
```

```tsx
// ❌ Wrapping a cheap value that nothing downstream depends on
const label = useMemo(() => `${user.firstName} ${user.lastName}`, [user]);
```

## Input responsiveness (INP)

- A non-urgent state update driven by typing, dragging, or filtering SHOULD be wrapped in `useTransition` or `useDeferredValue` so input stays responsive.
- An expensive handler bound to a high-frequency event (search-as-you-type, scroll, resize) MUST be debounced or throttled.
- Work over ~50ms on the main thread MUST be broken up or moved off the critical path. MUST NOT run a synchronous heavy loop inside an event handler.

```tsx
// ✅ Keystrokes stay responsive; filtering is deferred
const [isPending, startTransition] = useTransition();
const onChange = (value: string) => startTransition(() => setQuery(value));
```

```tsx
// ❌ Every keystroke blocks on the full filter
const onChange = (value: string) => setResults(filterHugeList(value));
```

## Third-party scripts

- Adding any third-party script (analytics, chat, A/B, tag manager) MUST go through an approval issue covering bundle and runtime cost, privacy, and a CSP entry (see [`security.md`](./security.md)).
- Approved scripts MUST load deferred or async and MUST NOT block first paint.
- A third-party script MUST NOT be injected via `dangerouslySetInnerHTML` (see [`security.md`](./security.md)).

### Stack A

- Third-party scripts MUST use `next/script` with an explicit non-blocking strategy (`afterInteractive` or `lazyOnload`). `beforeInteractive` requires an accepted exception.

```tsx
// ✅ Non-blocking, approved analytics
<Script src="https://cdn.example.com/a.js" strategy="lazyOnload" />
```

```tsx
// ❌ Render-blocking script in the document head
<script src="https://cdn.example.com/a.js" />
```

## Rendering and data cost

- A list over ~100 rows SHOULD be virtualized. An unbounded list MUST NOT render without pagination or virtualization.
- Client-side request waterfalls MUST be avoided: colocate or parallelize fetches rather than chaining dependent requests in nested components.
- Server-state fetch cost (`staleTime`, `gcTime`, invalidation) is governed by [`code/state-and-data.md`](./code/state-and-data.md).

```tsx
// ✅ Parallel, independent requests
const [user, orders] = await Promise.all([getUser(id), getOrders(id)]);
```

```tsx
// ❌ Waterfall: orders waits on user for no reason
const user = await getUser(id);
const orders = await getOrders(id);
```

## Memory and cleanup

- Every effect that subscribes (event listener, interval, timeout, observer, websocket, store subscription) MUST return a cleanup that tears it down.
- A fetch started in an effect MUST be abortable via `AbortController` and MUST be aborted on unmount or dependency change.

```tsx
// ✅ Listener and request both cleaned up
useEffect(() => {
  const controller = new AbortController();
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  getData({ signal: controller.signal }).then(setData);
  return () => {
    window.removeEventListener("resize", onResize);
    controller.abort();
  };
}, []);
```

```tsx
// ❌ Listener leaks on every mount; in-flight request resolves after unmount
useEffect(() => {
  window.addEventListener("resize", () => setWidth(window.innerWidth));
  getData().then(setData);
}, []);
```

## Loading UX

- A load that replaces a known layout MUST use a skeleton that reserves the final dimensions, not a centered spinner. A spinner over a sized region causes a layout jump when content arrives.
- A spinner is allowed only for an indeterminate action with no predictable layout (a button submit, a full-page boot).
- The required loading, empty, and error states themselves are defined in [`code/components.md`](./code/components.md). This rule governs which loading affordance to pick.

```tsx
// ✅ Skeleton holds the row's real shape; no shift on load
{isLoading ? <UserRowSkeleton /> : <UserRow user={user} />}
```

```tsx
// ❌ Spinner collapses the layout, then content pushes it open
{isLoading ? <Spinner /> : <UserRow user={user} />}
```

## CI gates

- A Lighthouse CI run (or equivalent) MUST gate merges against the Core Web Vitals budget above. A regression past threshold blocks merge.
- A bundle-size check MUST gate merges and MUST report per-route first-load JS. A route over budget blocks merge.
- The specific tools are chosen in CI config, not mandated here. The thresholds those tools enforce MUST match the numbers in this file. The pipeline is described in [`tooling/lint-format.md`](./tooling/lint-format.md).
