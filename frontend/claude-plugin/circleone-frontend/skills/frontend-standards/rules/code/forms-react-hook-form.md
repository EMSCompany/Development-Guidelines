> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/forms-react-hook-form.md

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

## Controller

- Every registry-bound control MUST be wrapped in `<Controller />`. MUST NOT call `register` on registry primitives; they are controlled components.
- `isInvalid` comes from `fieldState.invalid`, fed into the shared error contract.

## Wiring per control type

The control determines how `field` connects. Two patterns only.

### Spread `field` (Input, Textarea)

- Text controls MUST spread `field` directly.

### `value` + `onChange` (Select, Checkbox, Switch, RadioGroup)

- Non-text controls MUST bind `field.value` and `field.onChange` explicitly. MUST NOT spread `field` onto them; they do not take a native `onChange` event.

### Checkbox group

- A checkbox group MUST manage the array through `field.value` and `field.onChange`. The `<FieldGroup />` MUST carry `data-slot="checkbox-group"`.

## Submit

- Submission MUST go through `form.handleSubmit(onSubmit)`. MUST NOT read values out of state manually.
- The submit control MUST be disabled while `form.formState.isSubmitting`.

## Arrays

- Dynamic arrays MUST use `useFieldArray`.
- The list key MUST be `field.id` from `useFieldArray`. MUST NOT key on the array index.

## Server errors

- Server-side validation failures MUST be mapped back onto the offending fields with `setError`. A toast MAY accompany it but MUST NOT be the only signal.

