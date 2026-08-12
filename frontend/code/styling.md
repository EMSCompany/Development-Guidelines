# Styling

Applies to Stacks A and B, which both use Tailwind v4 on the shadcn/ui registry. Read [`../conventions.md`](../conventions.md) first. Stack C is bound only where a `### Stack C` subheading appears; elsewhere the styling intent carries over but these utilities do not. Class-sort config lives in [`../tooling/lint-format.md`](../tooling/lint-format.md).

## Tailwind only

- Styling MUST be Tailwind utilities. MUST NOT use CSS modules, styled-components, Sass, or standalone `.css` files, except the single global stylesheet that holds tokens and the base layer.
- MUST NOT use inline `style={{}}` except for a genuinely dynamic value that cannot be a class (a computed transform, a CSS variable set from JS).

```tsx
// ✅ Dynamic value via CSS variable, everything else is a class
<div
  className="bg-muted"
  style={{ "--progress": `${pct}%` } as React.CSSProperties}
/>
```

```tsx
// ❌ Static styling that should be utilities
<div style={{ padding: 16, background: "#f4f4f5" }} />
```

## Class order

- Class order MUST be left to `prettier-plugin-tailwindcss`. MUST NOT hand-order classes or fight the formatter.
- The plugin MUST list `cn` and `cva` in `tailwindFunctions` so classes inside them sort too.

## Registry first

- Reach for a registry component before writing ad-hoc Tailwind. Ad-hoc utilities are for layout and one-off spacing, not for re-creating something the registry already provides.

```tsx
// ✅ Use the registry primitive
import { Button } from "@/shared/ui/button";
<Button variant="secondary">Save</Button>;
```

```tsx
// ❌ Re-building a button the registry already ships
<button className="inline-flex h-9 items-center rounded-md bg-secondary px-4 text-sm">
  Save
</button>
```

## Variants: `cva`

- A component with more than one visual variant MUST express variants with `cva`. MUST NOT branch class strings with ternaries or template literals.

```tsx
// ✅ cva owns the variant matrix
const badge = cva("inline-flex rounded px-2 py-0.5 text-xs", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      danger: "bg-destructive text-white",
    },
  },
  defaultVariants: { tone: "neutral" },
});
```

```tsx
// ❌ Ternary soup; unscalable and hard to read
const cls = `rounded px-2 ${tone === "danger" ? "bg-destructive text-white" : "bg-muted"}`;
```

## Arbitrary values

- Use arbitrary values `[...]` only when no theme token or scale step fits. MUST NOT use an arbitrary value where a token or scale step exists.
- MUST NOT hardcode arbitrary colors. Color comes from tokens (see Theme tokens).

```tsx
// ✅ Token and scale
<div className="bg-background p-4" />
```

```tsx
// ❌ Arbitrary where a token/step exists
<div className="bg-[#ffffff] p-[16px]" />
```

## `!important`

- MUST NOT use the `!` important modifier or `!important`, except: (a) overriding inline styles injected by a third-party script you do not control, or (b) a documented print-stylesheet override.
- Each permitted use MUST carry an exception comment (see [`../conventions.md`](../conventions.md)).

```tsx
// ✅ SHOULD-EXCEPTION(styling): vendor widget sets inline z-index we cannot reach. PR #312.
<div className="!z-50" />
```

## Theme tokens

- Color, radius, and shadow MUST come from semantic CSS-variable tokens (`bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `ring-ring`). MUST NOT use Tailwind's raw palette (`bg-zinc-900`, `text-gray-500`) in app code.
- Tokens are defined once in the global stylesheet via `:root` / `.dark` plus `@theme inline`. MUST NOT declare color anywhere else.

```css
/* ✅ globals.css: tokens in one place */
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

## Dark mode

- Dark mode MUST use the `.dark` class strategy with `@custom-variant dark (&:is(.dark *))`, toggled by a provider. Stack A uses `next-themes`; Stack B uses the app theme provider.
- MUST NOT pair `dark:` variants with hardcoded palette colors. Tokens already invert under `.dark`, so correct token usage needs almost no `dark:` overrides.

```tsx
// ✅ Tokens invert automatically
<div className="bg-background text-foreground" />
```

```tsx
// ❌ Manual inversion with raw palette: drifts from the theme, doubles the work
<div className="bg-white text-black dark:bg-black dark:text-white" />
```

## Spacing and layout ownership

A component never reaches outside its own box. This is what makes a component safe to drop into any layout.

- A component MUST NOT set its own outer margin. Spacing between siblings is owned by the parent.
- Prefer `gap` on a flex or grid parent over margins for spacing between children. MUST NOT use `space-x`/`space-y` or per-child margins where `gap` works.
- When margin is unavoidable, use the top side only (`mt`). MUST NOT use `mb`. One direction means spacing never doubles or collapses unpredictably between two components that each set their own.
- Spacing MUST make grouping unambiguous: the gap between groups MUST be larger than the gap within a group. Equal spacing everywhere reads as one flat list and hides the structure.

```tsx
// ✅ Tighter within the field, looser between fields: groups read clearly
<div className="flex flex-col gap-6">
  <div className="flex flex-col gap-1">
    <Label>Email</Label>
    <Input />
  </div>
  <div className="flex flex-col gap-1">
    <Label>Password</Label>
    <Input />
  </div>
</div>
```

```tsx
// ❌ One gap for everything: label, input, and next field all look equally related
<div className="flex flex-col gap-3">
  <Label>Email</Label>
  <Input />
  <Label>Password</Label>
  <Input />
</div>
```

```tsx
// ✅ Parent owns the rhythm; children are self-contained
<div className="flex flex-col gap-4">
  <OrderSummary order={order} />
  <OrderItems items={order.items} />
</div>
```

```tsx
// ❌ Each child pushes from below; spacing doubles when stacked with another mb child
<div>
  <OrderSummary className="mb-4" />
  <OrderItems className="mb-4" />
</div>
```

## Passing classes to shared components

- Every shared and `ui/` component MUST accept `className` and merge it last with `cn()` (clsx + tailwind-merge) so callers can override.
- Callers pass layout and spacing through `className`. MUST NOT pass colors or internal structural classes that fight the component's own styling.
- MUST NOT build class strings with template literals or `clsx` alone. `cn()` is required so conflicting utilities resolve in the caller's favor.

```tsx
// ✅ className merged last; caller wins on conflict
type CardProps = { className?: string } & React.ComponentProps<"div">;
export function Card({ className, ...rest }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)} {...rest} />
  );
}

// caller
<Card className="mt-4 p-6" />; // p-6 overrides p-4 via tailwind-merge
```

```tsx
// ❌ Template literal: no conflict resolution, base p-4 and caller p-6 both ship
export function Card({ className }: CardProps) {
  return <div className={`rounded-lg border bg-card p-4 ${className}`} />;
}
```

## Responsive

- Layouts MUST be mobile-first: base styles target small screens, breakpoints (`sm:`, `md:`, ...) add for larger. MUST NOT use `max-*` breakpoints to walk back from desktop unless a specific case requires it.
- MUST NOT hardcode pixel widths for layout. Use the spacing scale, `container`, and fractional or grid widths.

```tsx
// ✅ Mobile-first, scales up
<div className="grid grid-cols-1 gap-4 md:grid-cols-3" />
```

```tsx
// ❌ Desktop-first with a max breakpoint and a hardcoded width
<div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 w-[960px]" />
```

## Layering (z-index)

One principle drives everything here: **portals do the stacking; `z-index` only orders in-page chrome.** Whichever primitive library the registry resolves to (Radix, Base UI, React Aria), floating surfaces are portaled to the end of `<body>` and stack by DOM order — Radix, Base UI, and React Aria set no z-index at all, and shadcn's registry adds a uniform defensive `z-50`. The scale below is library-agnostic and survives a registry swap.

- The app root MUST create its own stacking context with `isolation: isolate` (the `isolate` utility on the root layout wrapper in Stack A, on the `#root` wrapper in Stack B). Portals render after that wrapper, so no in-page z-index — however large — can ever cover a portaled surface.
- Every `z-index` MUST be a layer from the table below. MUST NOT use arbitrary `z-[...]` or a number outside the table. A missing layer is added to this table first, never inlined.

| Layer   | Class   | What lives there                                                                                          |
| ------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Below   | `-z-10` | Decorative backgrounds behind the parent's own content                                                     |
| Base    | `z-0`   | Normal flow; also the explicit anchor when a child needs a stacking-context reset                          |
| Raised  | `z-10`  | In-page elements above siblings: badge on an avatar, caption over an image, overlapping avatar stack       |
| Sticky  | `z-20`  | Sticky section headers, sticky table headers and columns inside scroll areas                               |
| Fixed   | `z-30`  | App chrome: fixed top nav, sidebar, bottom bar                                                             |
| Overlay | `z-40`  | Full-page scrims owned by app chrome: mobile-nav backdrop, global loading veil                             |
| Popup   | `z-50`  | Every portaled surface: dialog, sheet, drawer, dropdown, select, popover, tooltip, hover card, context menu, command palette |
| Toast   | `z-60`  | Notifications — the only layer above Popup, so toasts stay visible over an open dialog                     |

Rules that keep the table honest:

- All portaled surfaces share the single Popup layer. MUST NOT raise one popup above another with z-index (tooltip above dialog, select above sheet): ordering between portaled surfaces comes from portal order in the DOM — a tooltip opened from inside a dialog is appended after it and stacks above it automatically. If a portaled surface renders behind another, the bug is portal order or a missing portal, never a too-small z-index.
- Registry `ui/` components already carry their layer. MUST NOT edit the z-index inside a registry component to fix a feature-level stacking problem.
- Feature code SHOULD NOT need anything above Fixed (`z-30`); floating UI comes from the registry, which already owns Popup. Mount `<Toaster />` last in the root layout so DOM order backs up its layer.
- z-index only competes inside one stacking context. When an element "won't come to the front", first look for an ancestor that creates a stacking context (`transform`, `filter`, `opacity`, `will-change`, `isolate`) and fix that; raising the number is treating the symptom.
- A third-party embed that injects its own huge z-index MUST be caged in a wrapper with `isolate` plus a layer from the table so its internal values cannot escape the wrapper. MUST NOT be out-escalated (the `!important` section covers the inline-style exception).

```tsx
// ✅ Isolated root: page content can never cover portaled UI, which mounts after it
<body>
  <div className="isolate">{children}</div>
  {/* portals from the registry land here */}
</body>
```

```tsx
// ✅ Each element on its layer; popups come from the registry and bring their own
<header className="sticky top-0 z-20" />
<nav className="fixed inset-y-0 left-0 z-30" />
```

```tsx
// ❌ Escalation war: arbitrary value forcing a tooltip above a dialog
<TooltipContent className="z-[9999]" />
```

### Stack C (React Native)

- RN has no page-global stacking: `zIndex` only orders siblings within the same parent, so the web table does not transfer. Floating UI MUST render through a portal/host mounted at the app root (the portal or modal component the UI library provides) and stacks by mount order, exactly like web portals.
- Keep sibling-local `zIndex` values small (0–10) with the same semantic intent (raised, sticky header, overlay). MUST NOT use magic values like `9999`.
- On Android, `elevation` participates in stacking and drawing order; when `zIndex` is set on Android-visible views, set `elevation` alongside it.

## Consistency across the team

These keep shared code predictable so any developer can read and extend another's components.

- Square elements MUST use `size-*`, not an `h-*`/`w-*` pair.
- A container MUST use one spacing mechanism. MUST NOT mix `gap` with sibling margins in the same parent.
- `z-index` MUST come from the layer table in [Layering (z-index)](#layering-z-index). MUST NOT use arbitrary `z-[...]`. If you need a layer the table lacks, add it to the table, do not inline it.
- Font size MUST come from the type scale (`text-sm`, `text-base`, `text-lg`, ...). MUST NOT use an arbitrary `text-[17px]`. If a step is missing, add it to the scale, do not inline it.
- A utility cluster repeated three or more times MUST be promoted to a registry component or a `cva` variant. MUST NOT copy-paste the same class string across files.
- Breakpoints are the Tailwind default set. MUST NOT introduce ad-hoc custom breakpoints in a single component.

```tsx
// ✅ size-* for square, scale z-index, one spacing mechanism
<span className="z-10 inline-flex size-6 items-center justify-center" />
```

```tsx
// ❌ h/w pair, arbitrary z, gap and margin mixed in one container
<div className="flex gap-4">
  <span className="z-[999] h-6 w-6 mr-2" />
</div>
```
