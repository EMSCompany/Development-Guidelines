> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/forms-tanstack-form.md

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



## Fields

- Every field MUST be rendered through the `form.Field` render prop (the `children` function). MUST NOT manage field values in separate `useState`.
- `isInvalid` MUST be derived as `field.state.meta.isTouched && !field.state.meta.isValid`, then fed into the shared error contract.
- `<FieldError />` MUST receive `field.state.meta.errors`.



## Wiring per control type

### Text controls (Input, Textarea)

- Text controls MUST bind `value={field.state.value}`, `onChange={(e) => field.handleChange(e.target.value)}`, and `onBlur={field.handleBlur}`.


Note: TanStack Form text controls take the value, not a spread. Unlike RHF, there is no `field` object to spread onto the input.

### Value controls (Select, Switch, RadioGroup)

- These MUST bind `field.state.value` and pass `field.handleChange` directly to the control's change handler (no event unwrap).


### Checkbox group

- A checkbox group MUST use `mode="array"` on `form.Field` and the array helpers `field.pushValue` / `field.removeValue`. The `<FieldGroup />` MUST carry `data-slot="checkbox-group"`.


## Submit

- The `<form>` `onSubmit` MUST call `e.preventDefault()` then `form.handleSubmit()`. MUST NOT read values out of component state.
- The submit control MUST be disabled while submitting, read from `form.state.isSubmitting` via `form.Subscribe`.



## Arrays

- Dynamic arrays MUST use `mode="array"` and access items by bracket-notation field names (`emails[${index}].address`).
- Add and remove MUST go through `field.pushValue` and `field.removeValue`. MUST NOT splice `field.state.value` directly.


Note on keys: array items here are keyed by index because TanStack Form addresses items by positional name (`emails[${index}]`) and has no per-item id like RHF's `field.id`. This is the one place an index key is correct. Removal uses `field.removeValue(index)`, which keeps positions and names aligned.

## Server errors

- Server-side validation failures MUST be surfaced on the offending field, not by toast alone. Map the server error into the field via `form.setFieldMeta`, or set a form-level error the field renders.


