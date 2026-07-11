# Security

Applies to both stacks. Read [`conventions.md`](./conventions.md) first. Security is a precedence floor: a rule here overrides any rule elsewhere that would weaken it.

## Trust boundaries and input validation

- Every value crossing a boundary (network response, form, URL or search params, route params, `postMessage`, storage, file) MUST be parsed and validated with Zod before use. MUST NOT treat a TypeScript type as a runtime guarantee.
- API responses MUST be validated with `.parse` / `.safeParse`. MUST NOT cast an untrusted payload with `as`.
- Client-side validation is UX, not security. The same validation MUST run on the server (Server Action, route handler, or API). See [`code/forms.md`](./code/forms.md) and [`code/state-and-data.md`](./code/state-and-data.md).

```ts
// ✅ Untrusted payload is parsed; only valid data flows on
const user = UserSchema.parse(await res.json());
```

```ts
// ❌ A lie to the compiler; malformed data crashes deep in the UI
const user = (await res.json()) as User;
```

### Stack B

- URL and search params MUST be validated with `validateSearch` (Zod) on the route before any component reads them.

## Output and injection

- `dangerouslySetInnerHTML` is forbidden except for trusted HTML from an approved source. Each use MUST sanitize (DOMPurify or equivalent) and MUST carry an exception comment (see [`conventions.md`](./conventions.md)).
- MUST NOT build HTML or URLs by concatenating user input. Rely on the framework's escaping so user input never becomes code.
- An `href` or `src` derived from user or external data MUST be checked against an allowlist of schemes (`http`, `https`, `mailto`). MUST NOT allow `javascript:` URLs.
- An external link with `target="_blank"` MUST set `rel="noopener noreferrer"`.

```tsx
// ✅ Sanitized at the boundary, exception documented
// SHOULD-EXCEPTION(security): server-rendered article HTML, sanitized. PR #401.
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.html) }} />
```

```tsx
// ❌ Raw user/CMS HTML straight into the DOM: stored XSS
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
```

## Authentication and tokens

- Auth tokens and session identifiers MUST be stored in `httpOnly`, `Secure`, `SameSite` cookies. MUST NOT store them in `localStorage`, `sessionStorage`, or a non-`httpOnly` cookie.
- MUST NOT place a token anywhere JavaScript can read it for convenience. If JS can read it, an XSS can exfiltrate it.
- Sign-out MUST invalidate the session server-side, not only delete the client cookie.

```ts
// ✅ Set server-side, unreadable by JS
res.cookies.set("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
});
```

```ts
// ❌ Readable by any script on the page
localStorage.setItem("token", token);
```

## Authorization

- Authorization MUST be enforced server-side on every protected action and data fetch. A client-side check is UX only and MUST NOT be the only gate.
- Hiding a button, link, or route MUST NOT be treated as access control. The endpoint behind it MUST re-check identity and permission.

```ts
// ✅ Server re-checks before doing the work
export async function deleteOrder(id: string) {
  const user = await requireUser();
  if (!user.can("order:delete")) throw new ForbiddenError();
  // ...
}
```

```tsx
// ❌ "Authorization" that any user can bypass by calling the endpoint directly
{user.isAdmin && <DeleteOrderButton id={id} />}
```

### Stack A

- Server Actions and route handlers MUST verify the caller's identity and permission before doing work. A middleware redirect is a convenience, not the authorization.

## Environment variables and secrets

- Only non-sensitive, public values MAY carry the `NEXT_PUBLIC_` (Stack A) or `VITE_` (Stack B) prefix. Anything prefixed is shipped in the client bundle and is public forever.
- A secret (API key, database URL, signing key, private token) MUST NOT carry a public prefix and MUST NOT be read in client code.
- Secrets MUST NOT be committed. `.env*` files holding real values MUST be gitignored; a committed `.env.example` lists the keys with empty values.

```ts
// ✅ Public, safe to ship
const url = process.env.NEXT_PUBLIC_SITE_URL;
```

```ts
// ❌ Secret behind a public prefix: now in the client bundle, forever
const key = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
```

## Third-party scripts and CSP

- A third-party script MUST go through the approval process in [`performance.md`](./performance.md) and MUST be added to the CSP allowlist. A script MUST NOT load from an origin that is not on the list.
- A Content Security Policy MUST be served. It MUST NOT include `unsafe-inline` or `unsafe-eval` for scripts without an accepted exception.
- Subresource Integrity (SRI) SHOULD be set on externally hosted scripts where the host supports it.

## File uploads

- Uploads MUST be constrained by an allowlist of type (MIME and extension) and a maximum size, enforced server-side. Client checks are UX only.
- File type MUST be verified server-side by content (magic bytes), not by extension or the client-sent MIME alone.
- Uploaded files MUST be scanned or validated, and MUST NOT be served from a path that can execute them. Serve user content from a separate origin or bucket where possible.

## Logging

- Logs MUST NOT contain secrets, auth tokens, passwords, full request or response bodies, or PII (email, phone, address, payment data).
- Error reporting (Sentry or equivalent) MUST scrub tokens and PII before sending.
- MUST NOT `console.log` request payloads or user objects in production code paths.

```ts
// ✅ Identify by a non-sensitive id only
logger.info("checkout completed", { orderId });
```

```ts
// ❌ Dumps PII and possibly a token into the log sink
logger.info("checkout completed", { user, request });
```

## Dependencies

- A vulnerability scan (`npm audit` or equivalent) MUST run in CI. A high or critical advisory blocks merge until it is resolved or explicitly accepted via an issue.
- The lockfile MUST be committed and MUST be the source of installed versions. CI MUST install with `npm ci` (or the pinned-install equivalent).
- A new dependency MUST be vetted (maintenance, adoption, transitive weight) before adding. Bundle cost rules are in [`performance.md`](./performance.md).
- Production dependencies MUST NOT be installed from arbitrary git URLs or unpinned tags.
