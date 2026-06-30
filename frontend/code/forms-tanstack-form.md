# Forms: TanStack Form

Library-specific wiring for new projects on TanStack Form. The library selection rule and all shared form rules (validation, types, primitives, error contract, messages, defaults, grouping, reset) live in [`forms.md`](./forms.md). This file covers only TanStack Form wiring.

## Setup

- The form instance MUST be created with `useForm`, with the Zod schema passed to `validators`.
- `defaultValues` MUST cover every field (see [`forms.md`](./forms.md)).
- The schema is the same one used on the server (see [`forms.md`](./forms.md)).

```tsx
import { useForm } from "@tanstack/react-form";
import { bugReportSchema } from "@/domains/bug-report/schema";

const form = useForm({
  defaultValues: { title: "", description: "" },
  validators: { onBlur: bugReportSchema },
  onSubmit: async ({ value }) => {
    await createBugReport(value);
  },
});
```

## Validation mode

- The default validator MUST be `onBlur`, matching the touched-then-revalidate behavior the team standard expects.
- `onChange` MAY be added for a field that needs live feedback. MUST NOT rely on `onSubmit` alone for a form users edit field by field.

```tsx
// ✅ Validate on blur by default
validators: {
  onBlur: bugReportSchema;
}
```

```tsx
// ❌ Submit-only validation: no feedback until the user gives up and hits submit
validators: {
  onSubmit: bugReportSchema;
}
```

## Fields

- Every field MUST be rendered through the `form.Field` render prop (the `children` function). MUST NOT manage field values in separate `useState`.
- `isInvalid` MUST be derived as `field.state.meta.isTouched && !field.state.meta.isValid`, then fed into the shared error contract.
- `<FieldError />` MUST receive `field.state.meta.errors`.

```tsx
// ✅ Render prop owns the field; error contract satisfied
<form.Field
  name="title"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Title</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    );
  }}
/>
```

```tsx
// ❌ Shadow state outside the form: TanStack Form no longer owns the value
const [title, setTitle] = useState("");
<Input value={title} onChange={(e) => setTitle(e.target.value)} />;
```

## Wiring per control type

### Text controls (Input, Textarea)

- Text controls MUST bind `value={field.state.value}`, `onChange={(e) => field.handleChange(e.target.value)}`, and `onBlur={field.handleBlur}`.

```tsx
// ✅
<Textarea
  id={field.name}
  name={field.name}
  value={field.state.value}
  onBlur={field.handleBlur}
  onChange={(e) => field.handleChange(e.target.value)}
  aria-invalid={isInvalid}
/>
```

Note: TanStack Form text controls take the value, not a spread. Unlike RHF, there is no `field` object to spread onto the input.

### Value controls (Select, Switch, RadioGroup)

- These MUST bind `field.state.value` and pass `field.handleChange` directly to the control's change handler (no event unwrap).

```tsx
// ✅ Select
<Select
  name={field.name}
  value={field.state.value}
  onValueChange={field.handleChange}
>
  <SelectTrigger id={field.name} aria-invalid={isInvalid}>
    <SelectValue placeholder="Select" />
  </SelectTrigger>
  <SelectContent>{/* items */}</SelectContent>
</Select>

// ✅ Switch
<Switch
  id={field.name}
  name={field.name}
  checked={field.state.value}
  onCheckedChange={field.handleChange}
  aria-invalid={isInvalid}
/>
```

### Checkbox group

- A checkbox group MUST use `mode="array"` on `form.Field` and the array helpers `field.pushValue` / `field.removeValue`. The `<FieldGroup />` MUST carry `data-slot="checkbox-group"`.

```tsx
// ✅ Array mode with push/remove
<form.Field
  name="tasks"
  mode="array"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
    return (
      <FieldSet>
        <FieldLegend variant="label">Tasks</FieldLegend>
        <FieldGroup data-slot="checkbox-group">
          {tasks.map((task) => (
            <Field
              key={task.id}
              orientation="horizontal"
              data-invalid={isInvalid}
            >
              <Checkbox
                checked={field.state.value.includes(task.id)}
                onCheckedChange={(checked) => {
                  if (checked) field.pushValue(task.id);
                  else field.removeValue(field.state.value.indexOf(task.id));
                }}
                aria-invalid={isInvalid}
              />
            </Field>
          ))}
        </FieldGroup>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    );
  }}
/>
```

## Submit

- The `<form>` `onSubmit` MUST call `e.preventDefault()` then `form.handleSubmit()`. MUST NOT read values out of component state.
- The submit control MUST be disabled while submitting, read from `form.state.isSubmitting` via `form.Subscribe`.

```tsx
// ✅ preventDefault then handleSubmit; submit disabled while in flight
<form
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
>
  {/* fields */}
  <form.Subscribe selector={(s) => s.isSubmitting}>
    {(isSubmitting) => (
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    )}
  </form.Subscribe>
</form>
```

```tsx
// ❌ Native submit without preventDefault: full page reload, handleSubmit never runs
<form onSubmit={() => form.handleSubmit()}>
```

## Arrays

- Dynamic arrays MUST use `mode="array"` and access items by bracket-notation field names (`emails[${index}].address`).
- Add and remove MUST go through `field.pushValue` and `field.removeValue`. MUST NOT splice `field.state.value` directly.

```tsx
// ✅ Nested field by bracket notation; add/remove via helpers
<form.Field
  name="emails"
  mode="array"
  children={(field) => (
    <FieldSet>
      <FieldLegend variant="label">Email Addresses</FieldLegend>
      <FieldGroup>
        {field.state.value.map((_, index) => (
          <form.Field
            key={index}
            name={`emails[${index}].address`}
            children={(sub) => {
              const isInvalid =
                sub.state.meta.isTouched && !sub.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <Input
                    name={sub.name}
                    value={sub.state.value}
                    onBlur={sub.handleBlur}
                    onChange={(e) => sub.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={sub.state.meta.errors} />}
                </Field>
              );
            }}
          />
        ))}
      </FieldGroup>
      <Button type="button" onClick={() => field.pushValue({ address: "" })}>
        Add Email
      </Button>
    </FieldSet>
  )}
/>
```

Note on keys: array items here are keyed by index because TanStack Form addresses items by positional name (`emails[${index}]`) and has no per-item id like RHF's `field.id`. This is the one place an index key is correct. Removal uses `field.removeValue(index)`, which keeps positions and names aligned.

## Server errors

- Server-side validation failures MUST be surfaced on the offending field, not by toast alone. Map the server error into the field via `form.setFieldMeta`, or set a form-level error the field renders.

```tsx
// ✅ Server error lands on the field
onSubmit: async ({ value }) => {
  const result = await createBugReport(value);
  if (!result.ok) {
    form.setFieldMeta("title", (meta) => ({
      ...meta,
      errorMap: { onSubmit: result.error },
    }));
    return;
  }
  form.reset();
};
```

```tsx
// ❌ Toast only: the field stays visually valid, user cannot see what to fix
if (!result.ok) toast.error(result.error);
```
