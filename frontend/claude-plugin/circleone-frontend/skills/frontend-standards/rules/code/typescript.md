> Auto-generated rules digest; example blocks are stripped. When a rule is ambiguous or you need to see the correct/incorrect pattern, read the full file: ../../references/code/typescript.md

# TypeScript

Applies to both stacks. Read [`../conventions.md`](../conventions.md) first. Lint enforcement lives in [`../tooling/lint-format.md`](../tooling/lint-format.md).

## Required tsconfig flags

These compiler options MUST be set. A project MUST NOT relax them locally without a standards change.

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "skipLibCheck": true,
  },
}
```

- `exactOptionalPropertyTypes` SHOULD be enabled. Disable per project only when third-party types make it impractical, documented per the exception process.

## `type` vs `interface`

- Use `type` by default for object shapes, unions, and aliases.
- Reach for `interface` only when you need declaration merging or a cleaner `extends` chain across many shapes.

## `any`

- MUST NOT use `any`.
- Where a third-party gap forces it, MUST isolate it behind a typed wrapper and MUST annotate with a justified `eslint-disable-next-line`.

## `unknown` over `any`

- Untrusted input (network, storage, `JSON.parse`, message events) MUST be typed `unknown` and narrowed before use.
- Narrowing at a boundary MUST go through a Zod schema, not manual casts (see [`../security.md`](../security.md)).

## `enum`

- MUST NOT use `enum`. Use a `const` object with `as const` and a derived union type.
- Reason: `enum` emits runtime code, has surprising numeric behavior, and is not a plain value.

## Non-null assertion (`!`)

- SHOULD NOT use `!` to silence a possibly-`undefined` value. Narrow with a guard instead.
- MUST NOT use `!` to defeat `noUncheckedIndexedAccess` on array or record access.
- MAY use `!` in test setup where a fixture is provably present.

## Type assertion (`as`)

- MUST NOT use `as` to force-fit unrelated types or bypass a real type error.
- MUST NOT use the `as unknown as T` double assertion.
- `as const` is encouraged. `as` to narrow `unknown` is allowed only after a runtime check.

## Return type annotations

- Exported non-component functions MUST declare an explicit return type. It pins the contract and prevents accidental widening.
- React components are exempt; the JSX return type is inferred.
- Internal (non-exported) functions MAY rely on inference.

## Discriminated unions for variants

- A type with mutually exclusive variants MUST be a discriminated union with a literal tag. MUST NOT model variants with optional fields or boolean flags.
- Reason: the tag lets the compiler narrow each branch and flags unhandled cases.

