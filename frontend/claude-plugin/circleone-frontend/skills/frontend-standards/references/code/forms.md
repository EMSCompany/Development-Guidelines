# Forms

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. This file holds the rules common to every form. Library-specific wiring lives in the two guides:

- [`forms-react-hook-form.md`](./forms-react-hook-form.md)
- [`forms-tanstack-form.md`](./forms-tanstack-form.md)

## Library selection

The team is mid-transition between two form libraries. The rule is per project, not per form.

- An existing project already on React Hook Form MUST stay on React Hook Form. Follow [`forms-react-hook-form.md`](./forms-react-hook-form.md).
- A new project MUST adopt TanStack Form. Follow [`forms-tanstack-form.md`](./forms-tanstack-form.md).
- MUST NOT mix both libraries in one project. MUST NOT use Formik, or build forms from raw `useState`.

Everything below applies regardless of library.

## Validation and types

- Every form MUST validate with Zod. MUST NOT validate with ad-hoc conditionals or a second validation library.
- Form value types MUST derive from the schema via `z.infer`. MUST NOT hand-write a parallel form interface.
- The schema MUST be the single source for both shape and messages.

```ts
// ✅ Schema is the source; the type is derived
const bugReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters."),
});
type BugReportValues = z.infer<typeof bugReportSchema>;
```

```ts
// ❌ Hand-written type drifts from the schema
type BugReportValues = { title: string; description: string };
const bugReportSchema = z.object({
  title: z.string(),
  description: z.string(),
});
```

## Schema naming

- A form schema MUST be named `xSchema` and its derived type `XValues`.

```
✅ bugReportSchema      ->  type BugReportValues
✅ createOrderSchema    ->  type CreateOrderValues
❌ formSchema           ->  type FormData
❌ bugReportValidator   ->  type IBugReport
```

## Primitives

- Forms MUST be built from the registry `<Field />` family (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldContent`). MUST NOT hand-roll label, description, or error markup.
- MUST NOT use the legacy shadcn form pattern: `<Form />`, `<FormField />`, `<FormItem />`, `<FormControl />`, `<FormMessage />`.

```tsx
// ❌ Legacy pattern, removed from the registry
<FormField
  control={form.control}
  name="title"
  render={({ field }) => (
    <FormItem>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Error contract

A field in an invalid state MUST express it in all three places. Missing any one is a defect.

1. `data-invalid` on the `<Field />`.
2. `aria-invalid` on the control (`<Input />`, `<SelectTrigger />`, `<Checkbox />`, etc.).
3. `<FieldError />` rendered with the field's errors.

```tsx
// ✅ All three present (RHF shown; TanStack derives isInvalid differently, same contract)
<Field data-invalid={fieldState.invalid}>
  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
  <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
</Field>
```

```tsx
// ❌ Visual error only; data-invalid and aria-invalid missing, so assistive tech sees nothing
<Field>
  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
  <Input {...field} id={field.name} />
  {fieldState.invalid && <span className="text-destructive">Invalid</span>}
</Field>
```

## Messages

- Validation messages MUST live in the Zod schema. MUST NOT duplicate or rewrite a message in JSX.

```ts
// ✅ Message defined once, in the schema
title: z.string().min(5, "Title must be at least 5 characters.");
```

```tsx
// ❌ Message duplicated in markup; the two will diverge
{
  fieldState.invalid && (
    <FieldError errors={["Title must be at least 5 characters."]} />
  );
}
```

## Default values

- `defaultValues` MUST be provided for every field. A field MUST NOT switch between controlled and uncontrolled across its lifecycle.

```ts
// ✅ Every field has an initial value
defaultValues: { title: "", description: "", priority: "medium" }
```

```ts
// ❌ Missing fields start uncontrolled, then become controlled on first keystroke
defaultValues: {
  title: "";
} // description and priority absent
```

## Grouping

- Checkbox groups and radio groups MUST be wrapped in `<FieldSet>` with a `<FieldLegend>`. A single checkbox/switch does not need a fieldset.

```tsx
// ✅ Grouped controls get a fieldset and legend
<FieldSet>
  <FieldLegend>Plan</FieldLegend>
  <RadioGroup>{/* items */}</RadioGroup>
</FieldSet>
```

## Shared client and server validation

- The same Zod schema MUST validate on the client (form) and on the server (Server Action or Route Handler). MUST NOT duplicate the validation logic.
- The schema lives in the domain layer and is imported by both sides (see [`state-and-data.md`](./state-and-data.md) and [`../security.md`](../security.md)).

```ts
// ✅ One schema, both sides
// domains/bug-report/schema.ts
export const bugReportSchema = z.object({
  /* ... */
});
export type BugReportValues = z.infer<typeof bugReportSchema>;

// client: useForm resolver / validators
// server: bugReportSchema.parse(input)
```

## Reset

- After a successful submit, the form MUST call `form.reset()` (to cleared or to the persisted values). MUST NOT leave a submitted form showing stale dirty state.
