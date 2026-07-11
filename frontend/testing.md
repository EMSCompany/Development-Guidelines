# Testing

Applies to both stacks. Read [`conventions.md`](./conventions.md) first.

The goal is confidence per test, not coverage for its own sake. A test earns its place by catching a real regression in something that matters; a test of trivial code is maintenance cost with no payoff. Most of the app does not need tests. The parts that do, need good ones.

## What MUST be tested

- Exported utilities and pure functions that contain branching, parsing, or arithmetic.
- Hooks that contain logic: state transitions, derived data, debouncing, edge cases.
- Zod schemas with refinements, transforms, or non-obvious constraints (see [`code/forms.md`](./code/forms.md)).
- Form validation behavior: invalid input produces the right error in the right place.
- Components with conditional logic, including the required loading, empty, and error states from [`code/components.md`](./code/components.md).
- Anything that touches money, authentication, permissions, or irreversible data changes.

## What MUST NOT be tested

- Third-party internals. Do not test that TanStack Query caches or that Zod validates an email.
- Trivial renders. A "renders without crashing" test proves nothing.
- Styling: class names, Tailwind output, cva variant strings. Visual concerns belong in Storybook.
- Static content, type-only modules, generated code, barrel files.
- Registry primitives from inside feature code. The registry has its own stories and tests.

```tsx
// ❌ Trivial render test — no behavior, no value
it("renders", () => {
  render(<UserCard user={mockUser} />);
});

// ❌ Testing the library, not our code
it("caches the query", async () => { ... });
```

```tsx
// ✅ Tests behavior that can regress
it("shows the empty state when the user has no orders", () => {
  render(<OrderList orders={[]} />);
  expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
});
```

## Runner and libraries

- Vitest is the only unit/integration runner. MUST NOT introduce Jest or any other runner.
- Components MUST be tested with React Testing Library. MUST NOT use shallow rendering or snapshot tests as the primary assertion.
- MUST query by accessible role, label, or text first (`getByRole`, `getByLabelText`). `data-testid` is a last resort for elements with no accessible handle, and its use SHOULD be justified in the test.
- SHOULD use `userEvent` over `fireEvent` for interactions.

Accessible queries double as an accessibility check: if `getByRole` can't find your button, neither can a screen reader (see [`accessibility.md`](./accessibility.md)).

## File location and naming

- Tests MUST be co-located with the source file as `<name>.test.ts` / `<name>.test.tsx`. MUST NOT use `__tests__/` directories or a separate test tree.
- `describe` MUST name the unit under test exactly (function, hook, or component name).
- `it` MUST state observable behavior in plain language, readable as a sentence.

```ts
// ✅
describe("formatPrice", () => {
  it("rounds to two decimals", () => { ... });
  it("throws on negative amounts", () => { ... });
});
```

```ts
// ❌ Vague names that describe the test, not the behavior
describe("price tests", () => {
  it("works", () => { ... });
  it("test 2", () => { ... });
});
```

## Mocking policy

Mock at boundaries. Everything inside the boundary runs for real.

- Network MUST be mocked with [MSW](https://mswjs.io/) request handlers. Unit and integration tests MUST NOT hit a real network.
- Time and randomness MUST be controlled (`vi.useFakeTimers`, seeded values) when behavior depends on them, and restored in `afterEach`.
- MUST NOT mock internals of the unit under test, and MUST NOT assert on internal calls that have no observable effect.
- MUST NOT mock registry components or the unit's own child components, except heavy irrelevant ones (charts, maps, editors) — justify inline when you do.
- Every test MUST pass in isolation and in any order. No shared mutable state between tests.

```ts
// ✅ Boundary mock: MSW handler
server.use(
  http.get("/api/orders", () => HttpResponse.json([]))
);
```

```ts
// ❌ Implementation mock: breaks on refactor, tests nothing real
vi.spyOn(useOrders, "fetchOrders");
expect(fetchOrders).toHaveBeenCalledTimes(1);
```

## Coverage

- Each project MUST set coverage thresholds in CI (Vitest `coverage.thresholds`). The threshold is a floor that blocks merge, chosen per project — not a company-wide number.
- Thresholds SHOULD be scoped to the directories that hold logic (utilities, hooks, schemas), not the whole `src/` tree.
- MUST NOT write trivial tests to satisfy a threshold. If a threshold forces valueless tests, lower the threshold via the exception process instead.

## Flaky tests

- A test that fails intermittently without a code cause MUST be quarantined (`it.skip` with a linked issue) as soon as the flake is confirmed. A flaky gate trains people to ignore red CI, which is worse than no gate.
- A quarantined test MUST be fixed or deleted within 14 days. After that, delete it — a permanently skipped test is dead code.
- MUST NOT mask flakiness with blanket CI retries. Playwright's per-test `retries` MAY be used, but a test that needs retries to pass is flaky and falls under this policy.

## Playwright (end-to-end)

- Playwright is only for critical user journeys: sign-in, the primary revenue/task path, and flows whose breakage is a production incident. Each journey gets exactly one happy-path spec; edge cases belong in Vitest.
- The journey list per app MUST be small (roughly 5–10 specs) and MUST be agreed in review — E2E suites grow slow and flaky when treated as the default test layer.
- Selectors MUST target user-facing roles, labels, and text. MUST NOT use CSS/XPath selectors coupled to markup.
- Each spec MUST create or seed its own data. Specs MUST NOT depend on execution order or on state left by another spec.
- E2E specs live in `e2e/` at the repository root (they test the app, not a module — the co-location rule doesn't apply).

## Storybook

- Shared UI components (registry components and reusable feature components) MUST have stories covering each meaningful variant and the required loading, empty, and error states.
- Stories are the visual spec — styling and variant appearance are reviewed there, not asserted in Vitest.
- Interaction behavior MAY be tested in stories with `play` functions when it keeps the story self-documenting; logic-heavy behavior still belongs in Vitest.
- One-off page compositions SHOULD NOT have stories.

## Stack notes

### Stack A

- Async Server Components and Server Actions don't render meaningfully under RTL. Extract their logic (validation, mapping, authorization checks) into pure functions and unit test those; the wiring is covered by the E2E journeys.

### Stack B

- Route loaders are plain functions — test them directly with mocked boundaries. MUST NOT spin up the router to test loader logic.

## CI gates

- The Vitest suite MUST pass with coverage thresholds met on every PR.
- Playwright journeys MUST pass before deploy to production; they SHOULD run on every PR if runtime allows.
- A PR that changes behavior in a MUST-be-tested area without touching tests SHOULD be questioned in review.
