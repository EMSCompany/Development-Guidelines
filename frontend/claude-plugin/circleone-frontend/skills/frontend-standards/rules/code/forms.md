> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/forms.md

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



## Schema naming

- A form schema MUST be named `xSchema` and its derived type `XValues`.


## Primitives

- Forms MUST be built from the registry `<Field />` family (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `FieldGroup`, `FieldContent`). MUST NOT hand-roll label, description, or error markup.
- MUST NOT use the legacy shadcn form pattern: `<Form />`, `<FormField />`, `<FormItem />`, `<FormControl />`, `<FormMessage />`.


## Error contract

A field in an invalid state MUST express it in all three places. Missing any one is a defect.

1. `data-invalid` on the `<Field />`.
2. `aria-invalid` on the control (`<Input />`, `<SelectTrigger />`, `<Checkbox />`, etc.).
3. `<FieldError />` rendered with the field's errors.



## Messages

- Validation messages MUST live in the Zod schema. MUST NOT duplicate or rewrite a message in JSX.



## Default values

- `defaultValues` MUST be provided for every field. A field MUST NOT switch between controlled and uncontrolled across its lifecycle.



## Grouping

- Checkbox groups and radio groups MUST be wrapped in `<FieldSet>` with a `<FieldLegend>`. A single checkbox/switch does not need a fieldset.


## Shared client and server validation

- The same Zod schema MUST validate on the client (form) and on the server (Server Action or Route Handler). MUST NOT duplicate the validation logic.
- The schema lives in the domain layer and is imported by both sides (see [`state-and-data.md`](./state-and-data.md) and [`../security.md`](../security.md)).


## Reset

- After a successful submit, the form MUST call `form.reset()` (to cleared or to the persisted values). MUST NOT leave a submitted form showing stale dirty state.
