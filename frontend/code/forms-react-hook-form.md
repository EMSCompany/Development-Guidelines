# Forms: React Hook Form

Library-specific wiring for projects on React Hook Form. The library selection rule and all shared form rules (validation, types, primitives, error contract, messages, defaults, grouping, reset) live in [`forms.md`](./forms.md). This file covers only RHF wiring.

## Setup

- The form instance MUST be created with `useForm`, typed by the schema, and validated with `zodResolver`.
- `defaultValues` MUST cover every field (see [`forms.md`](./forms.md)).

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  bugReportSchema,
  type BugReportValues,
} from "@/domains/bug-report/schema";

const form = useForm<BugReportValues>({
  resolver: zodResolver(bugReportSchema),
  mode: "onTouched",
  defaultValues: { title: "", description: "" },
});
```

## Validation mode

- `mode` MUST default to `onTouched`.
- `onChange` MAY be used only for a field that needs live feedback (a strength meter, an availability check). MUST NOT set `mode: "onChange"` form-wide to mask a validation gap.

```tsx
// ✅ Default for the form
useForm({ resolver: zodResolver(schema), mode: "onTouched" });
```

```tsx
// ❌ onChange everywhere: validates on every keystroke before the user has finished
useForm({ resolver: zodResolver(schema), mode: "onChange" });
```

## Controller

- Every registry-bound control MUST be wrapped in `<Controller />`. MUST NOT call `register` on registry primitives; they are controlled components.
- `isInvalid` comes from `fieldState.invalid`, fed into the shared error contract.

```tsx
// ✅ Controller drives the field; error contract satisfied
<Controller
  name="title"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
      <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

```tsx
// ❌ register on a controlled registry input: value/onChange not wired correctly
<Input {...form.register("title")} />
```

## Wiring per control type

The control determines how `field` connects. Two patterns only.

### Spread `field` (Input, Textarea)

- Text controls MUST spread `field` directly.

```tsx
// ✅
<Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
<Textarea {...field} id={field.name} aria-invalid={fieldState.invalid} />
```

### `value` + `onChange` (Select, Checkbox, Switch, RadioGroup)

- Non-text controls MUST bind `field.value` and `field.onChange` explicitly. MUST NOT spread `field` onto them; they do not take a native `onChange` event.

```tsx
// ✅ Select
<Select name={field.name} value={field.value} onValueChange={field.onChange}>
  <SelectTrigger id="language" aria-invalid={fieldState.invalid}>
    <SelectValue placeholder="Select" />
  </SelectTrigger>
  <SelectContent>{/* items */}</SelectContent>
</Select>

// ✅ Switch
<Switch
  id={field.name}
  checked={field.value}
  onCheckedChange={field.onChange}
  aria-invalid={fieldState.invalid}
/>
```

```tsx
// ❌ Spreading field onto a Select: onChange signature mismatch, value never updates
<Select {...field} />
```

### Checkbox group

- A checkbox group MUST manage the array through `field.value` and `field.onChange`. The `<FieldGroup />` MUST carry `data-slot="checkbox-group"`.

```tsx
// ✅ Add/remove against the array
<Checkbox
  checked={field.value.includes(task.id)}
  onCheckedChange={(checked) =>
    field.onChange(
      checked
        ? [...field.value, task.id]
        : field.value.filter((v) => v !== task.id),
    )
  }
  aria-invalid={fieldState.invalid}
/>
```

## Submit

- Submission MUST go through `form.handleSubmit(onSubmit)`. MUST NOT read values out of state manually.
- The submit control MUST be disabled while `form.formState.isSubmitting`.

```tsx
// ✅
<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* fields */}
  <Button type="submit" disabled={form.formState.isSubmitting}>
    Submit
  </Button>
</form>
```

```tsx
// ❌ Hand-assembled payload bypasses validation and the resolver
<Button onClick={() => save({ title, description })}>Submit</Button>
```

## Arrays

- Dynamic arrays MUST use `useFieldArray`.
- The list key MUST be `field.id` from `useFieldArray`. MUST NOT key on the array index.

```tsx
// ✅ Key on the stable field id
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "emails",
});

{
  fields.map((field, index) => (
    <Controller
      key={field.id}
      name={`emails.${index}.address`}
      control={form.control}
      render={({ field: f, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Input {...f} aria-invalid={fieldState.invalid} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  ));
}
```

```tsx
// ❌ Index key: removing an item misattributes state to the wrong row
{
  fields.map((field, index) => (
    <Controller key={index} name={`emails.${index}.address`} /* ... */ />
  ));
}
```

## Server errors

- Server-side validation failures MUST be mapped back onto the offending fields with `setError`. A toast MAY accompany it but MUST NOT be the only signal.

```tsx
// ✅ Field-level server error lands on the field
async function onSubmit(values: BugReportValues) {
  const result = await createBugReport(values);
  if (!result.ok) {
    form.setError("title", { message: result.error });
    return;
  }
  form.reset();
}
```

```tsx
// ❌ Toast only: the field stays visually valid, user cannot see what to fix
if (!result.ok) toast.error(result.error);
```
