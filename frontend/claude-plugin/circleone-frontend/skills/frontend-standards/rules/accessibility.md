> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../references/accessibility.md

# Accessibility

Applies to both stacks. Read [`conventions.md`](./conventions.md) first. Accessibility is a precedence floor: a rule here overrides any rule elsewhere that would weaken it.

## Target and enforcement

- WCAG 2.1 AA MUST be met for all user-facing UI. AAA is a MAY.
- `eslint-plugin-jsx-a11y` MUST pass with zero warnings. A rule MUST NOT be disabled inline without an accepted exception comment (see [`conventions.md`](./conventions.md)).
- Automated checks catch a minority of issues. The manual checklist at the end of this file MUST pass before a PR is opened.

## Semantic HTML

- Native elements MUST be used for their purpose: `<button>`, `<a href>`, `<label>`, `<nav>`, `<main>`, `<ul>` / `<li>`, `<table>`. MUST NOT recreate them with `<div>` / `<span>` plus `role`.
- A clickable thing that navigates MUST be an `<a>`. A clickable thing that acts MUST be a `<button>`. MUST NOT use `<div onClick>`.
- Each page MUST have exactly one `<h1>`, and heading levels MUST NOT skip (no `<h2>` straight to `<h4>`).
- Heading level MUST be chosen by document structure, not by visual size. Pick the tag for the outline a screen reader reads; style it to any size with classes. MUST NOT pick `<h3>` because it "looks the right size."
- Each page MUST have one `<main>` landmark; primary navigation MUST be in `<nav>`.

## Keyboard

- Every interactive element MUST be reachable and operable by keyboard alone: Tab / Shift+Tab to move, Enter / Space to activate, Escape to dismiss, arrows where the pattern calls for it.
- MUST NOT use a positive `tabIndex`. Only `0` (include in natural order) or `-1` (programmatic focus target) are allowed.
- A custom interactive widget (menu, dialog, combobox, tabs) MUST implement the keyboard pattern from the ARIA Authoring Practices Guide. Prefer a registry primitive that already implements it over hand-rolling.
- Focus MUST be managed for overlays: trap focus while a dialog or menu is open, and return focus to the trigger on close. The registry dialog does this; MUST NOT break it.
- The first focusable element on a page MUST be a visible "skip to content" link.
- An essential action MUST NOT be revealed on hover only. Hover does not exist for keyboard or touch users, so a hover-only control MUST also be reachable by focus or tap (or be persistently visible).

## Focus visible

- A visible focus indicator MUST be present on every focusable element. MUST NOT apply `outline-none` (or remove the ring) without an equally visible replacement.
- The indicator MUST use `:focus-visible` (Tailwind `focus-visible:`), not `:focus`, so it shows for keyboard users without firing on mouse click.

## Color and contrast

- Text contrast MUST be at least 4.5:1, or 3:1 for large text (≥ 24px, or ≥ 19px bold). UI component boundaries and focus indicators MUST be at least 3:1.
- Color MUST NOT be the only means of conveying information. Pair state, error, and required signals with text, an icon, or a pattern.
- Contrast is a property of the theme tokens. MUST NOT introduce ad-hoc colors that break it (see [`code/styling.md`](./code/styling.md)).
- Text placed over an image MUST sit on a scrim, overlay, or solid panel that guarantees the contrast minimum. Image pixels vary, so MUST NOT rely on the photo alone to keep text readable.

## Forms

- Every input MUST have a programmatically associated label: `<label htmlFor>` or the registry `<Field>` / `<FieldLabel>`. A placeholder is not a label.
- Errors MUST be associated to the control and announced: `aria-invalid` plus `aria-describedby` pointing at the message element. The full error contract is in [`code/forms.md`](./code/forms.md).
- A required field MUST be marked both visually and programmatically (`required` / `aria-required`).
- Related controls (radio or checkbox groups) MUST be grouped in `<fieldset>` with a `<legend>`.

## Images and media

- Informative images MUST have descriptive `alt`. Decorative images MUST have `alt=""` (or be CSS backgrounds). MUST NOT omit the `alt` attribute. Format rules are in [`performance.md`](./performance.md).
- An icon-only button MUST have an accessible name via `aria-label` or visually-hidden text. MUST NOT rely on the icon alone.
- Meaningful video or audio MUST provide captions or a transcript.

## ARIA

- ARIA MUST be used only when no native element or semantic markup provides the behavior. First rule of ARIA: do not use ARIA.
- An element MUST NOT carry a `role` that contradicts its native role, and MUST NOT set `aria-*` that the native element already conveys.
- A dynamic status update that does not move focus MUST be exposed through an appropriate `aria-live` region.

## Motion

- Non-essential animation MUST respect `prefers-reduced-motion`. Reduce or remove motion when the user requests it (Tailwind `motion-reduce:` / `motion-safe:`).
- Content MUST NOT flash more than three times per second.

## Build UIs that don't suck

Craft defaults adapted from Adam Wathan's "Refactoring UI". These raise baseline quality. Most are SHOULD; the two that are objectively checkable in review are MUST.

- Every interactive element MUST define hover, focus, active, and disabled states. A control with only a default state is incomplete.
- Every data view MUST design its empty state, not just its populated state (see [`code/components.md`](./code/components.md)).
- Hierarchy SHOULD come from de-emphasis, not only emphasis. Limit how much shouts; lower the weight and color of secondary content instead of enlarging the primary.
- A label SHOULD NOT compete with its value. Rank them with size, weight, and color so the value reads first.
- Layouts SHOULD start with generous whitespace and tighten from there, rather than cramming and adding space later.
- Meaningful text SHOULD NOT rely on light-gray-on-white. Keep real contrast (see Color and contrast).

## Manual checks before PR

Run these on the changed UI. They MUST pass before the PR is opened.

- [ ] Tab through the whole change: order is logical, focus is always visible, nothing is reachable-but-dead or unreachable.
- [ ] Operate every control with the keyboard only, no mouse.
- [ ] Run one screen reader smoke pass (VoiceOver, NVDA, or equivalent) over new interactive UI.
- [ ] Zoom to 200%: no loss of content or function, and no horizontal scroll for body text.
- [ ] Verify the change under `prefers-reduced-motion` and in dark mode.
