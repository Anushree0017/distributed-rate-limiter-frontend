# Rate Limiter Admin UI — Addendum: Authentication + Clients (Phase 6)

Oct 2, 2026 · @Anushree M

Addendum for a coding agent. Read `drl-frontend-build-plan.md` (the base UI plan)
and `phase6_auth_multi_client_plan.md` (the backend contract) first. This document
only describes what changes in the frontend because the backend now has
authentication and multi-client (tenant) ownership. Where it conflicts with the
base plan, **this document wins.**

## 1. What changed on the backend (frontend-relevant summary)

- Every admin API call (`/rules*`, `/groups*`, `/clients*`, `GET /algorithms`)
  now requires `Authorization: Bearer <jwt>` with scope `admin`. Only `GET /health`
  is open.
- Tokens come from `POST /api/v1/auth/token` (OAuth2 client-credentials,
  form-encoded `grant_type=client_credentials`, `client_id`, `client_secret`,
  optional `scope`). Response: `{access_token, token_type, expires_in, scope}`.
  Default lifetime ~600s. Errors: 400 `invalid_request` / `invalid_scope`,
  401 `invalid_client` (identical for unknown client, bad secret, revoked secret,
  disabled client).
- Missing/invalid/expired token -> **401**. Valid token but insufficient scope or
  disabled client -> **403**.
- Every rule and group now belongs to exactly one **client** (`client_id` slug,
  e.g. `orders-service`). Rules and groups responses include `client_id`; create
  calls require it; list calls accept a `client_id` filter. A rule's client is
  immutable. Group members must be in the group's client; cross-client
  move-to-group / add-members returns 409.
- New clients API (scope `admin`): `POST/GET /clients`, `GET/PATCH /clients/{client_id}`,
  `POST /clients/{client_id}/secrets`, `DELETE /clients/{client_id}/secrets/{secret_id}`.
  The plaintext secret is returned **once**, only in the create-client and
  add-secret responses. There is no client hard-delete (disable instead).

## 2. Decisions to confirm before building

1. **How the SPA holds admin credentials (default: option A).**
   - **A. Login screen, credentials kept in memory only.** Operator enters an
     admin `client_id` + `client_secret`; both live in a JS module variable (never
     localStorage/sessionStorage/cookies/URL); token auto-refreshes using the
     in-memory credentials; a page refresh means logging in again. Simple, fine
     for an internal tool.
   - **B. Backend-for-frontend (BFF) proxy** holding the credentials server-side.
     More secure, adds a component. Not in this phase.
   - **C. Real operator login (username/password/SSO).** Needs a separate identity
     type on the backend. Not in this phase.
   Build A; keep all auth logic behind `AuthProvider`/`api/client.ts` so B or C is
   a localized swap later.
2. **CORS vs same-origin proxy (default: same-origin proxy).** The browser now
   calls a token endpoint cross-origin if `API_URL` points elsewhere. Either the
   backend adds `CORS_ALLOWED_ORIGINS` handling (a backend change, not in Phase 6),
   or the frontend container's nginx proxies `/api/*` to the backend so the
   browser only ever talks to its own origin. The plan assumes the nginx proxy
   (Phase G); confirm, because it removes the CORS requirement entirely.
3. **Client scoping UX (default: global client switcher).** A header dropdown
   ("All clients" or one client) that pre-filters Rules and Groups lists and
   pre-selects the client on create forms, remembered in `localStorage` (the
   slug is not sensitive). Alternative: no global switcher, per-page filter only.

## 3. Changes to the project structure

```
src/
  api/
    auth.ts               # NEW: requestToken(clientId, secret), scope=admin
    clients.ts            # NEW: getClients, getClient, createClient, patchClient,
                          #      addSecret, revokeSecret
    client.ts             # CHANGED: attaches bearer, 401 refresh-retry, 403 handling
    rules.ts, groups.ts   # CHANGED: client_id on types, create bodies, list filters
    importSpec.ts         # unchanged (still client-side parsing only)
  auth/
    AuthProvider.tsx      # NEW: holds credentials + token in memory, exposes
                          #      login/logout/getToken, schedules refresh
    RequireAuth.tsx       # NEW: route guard, redirects to /login
    tokenStore.ts         # NEW: module-scoped (non-persistent) credential/token holder
  clients/
    ClientContext.tsx     # NEW: selected client (or "all"), persisted slug only
  queries/
    useClients.ts         # NEW
    useRules.ts, useGroups.ts   # CHANGED: client_id in query keys
  routes/
    login/                # NEW: LoginPage
    clients/              # NEW: ClientsListPage, ClientCreatePage,
                          #      ClientDetailPage, ClientEditPage
  components/
    ClientPicker.tsx      # NEW: select of clients (single), used on forms/filters
    ClientBadge.tsx       # NEW: slug chip, shows disabled state
    SecretRevealDialog.tsx# NEW: one-time secret display (see Section 6)
    forms/ScopesPicker.tsx# NEW: multi-select of {check, admin}
    forms/ConflictErrorBanner.tsx   # CHANGED: handles cross-client message
```

## 4. Auth layer (api/client.ts + AuthProvider)

- **Login:** `LoginPage` posts to `/auth/token` with `scope=admin`. Success ->
  store credentials + token in `tokenStore` (memory only), navigate to the
  originally requested route. Failure messages: `invalid_client` -> "Invalid
  client ID or secret"; `invalid_scope` -> "This client does not have admin
  access". Never echo what was typed.
- **Attach token:** `api/client.ts` adds `Authorization: Bearer` to every request
  except `/auth/token` and `/health`.
- **Refresh:** schedule a refresh at ~80% of `expires_in`. Use a **single-flight**
  refresh (one in-flight token request shared by concurrent callers) so a burst
  of parallel queries doesn't stampede the token endpoint.
- **401 handling:** on a 401 from any call, refresh once and retry the original
  request once. If the retry (or the refresh) fails, clear the session, clear the
  TanStack Query cache, and redirect to `/login` with a "session expired" notice.
- **403 handling:** do not retry. Show a full-page "Not authorized" state if it
  happens on navigation, or an inline error for mutations ("Your client was
  disabled or lacks admin scope"). Offer logout.
- **Logout:** wipe `tokenStore`, `queryClient.clear()`, redirect to `/login`.
- **Do not persist credentials, tokens, or secrets anywhere** (no localStorage,
  sessionStorage, cookies, IndexedDB, URL, or console logs). Disable
  TanStack Query devtools in production builds.
- `API_URL` still comes from `window.__CONFIG__` at runtime. With the nginx proxy
  (Phase G) it is typically a relative path.

## 5. Screens and routes

Sidebar becomes: Rules · Groups · **Clients** · Algorithms · Import, plus a header
with the **client switcher** (Decision 3), the logged-in client's slug, and
Logout.

### New routes

| Route | Screen | Notes |
| --- | --- | --- |
| `/login` | Login | Client ID + secret form; no sidebar; redirect target after success |
| `/clients` | Clients list | Table: slug, name, status, scopes, created; filters: name/status; row actions Edit, Enable/Disable |
| `/clients/new` | Client create | slug (validated `^[a-z0-9][a-z0-9-]{2,62}$`, immutable after creation), name, description, scopes. On success open `SecretRevealDialog` |
| `/clients/:client_id` | Client detail | Summary, status, scopes, **Secrets panel**, counts/links to its rules and groups (link to `/rules?client=<slug>` and `/groups?client=<slug>`) |
| `/clients/:client_id/edit` | Client edit | Name, description, scopes, status; **slug read-only** |

**Secrets panel (client detail):** table of secrets (hint `••••abcd`, created,
expires, revoked), buttons: **Add secret** (disabled with tooltip when two are
active, matching the backend's 409; on success open `SecretRevealDialog`) and
**Revoke** (confirm dialog via `ConfirmDialog`; if the backend returns 409 for
"last active secret", show it inline).

**Disabling a client:** the Enable/Disable action uses `ConfirmDialog` and states
the consequence ("Callers using this client will start getting 403 within about a
minute. Existing rules are kept."). Disabling the client you're logged in as
should require an extra explicit confirmation, since it will lock you out.

### Changes to existing screens

| Screen | Change |
| --- | --- |
| Rules list | Add **Client** column (`ClientBadge`) and `client_id` filter (also driven by the global switcher). Existing filters unchanged |
| Rule create | Required `ClientPicker` (defaults to the switcher selection; if "All clients" is selected, the field starts empty and must be chosen). Only `active` clients selectable |
| Rule edit | Client shown **read-only** (immutable). Grouped-locked variant unchanged otherwise |
| Rule detail | Show the owning client. Redis scope display remains `algorithm:signature` only (never value, digest, or client secret info) |
| Groups list | Add **Client** column and `client_id` filter, same as Rules |
| Group create | Required `ClientPicker`; initial-members sub-table implicitly belongs to that client |
| Group edit | Client read-only |
| Group detail | Show client; Add Members modal has no client choice (implicit) |
| Move-to-Group modal | Target group list is **restricted to the rule's own client**; a 409 (including cross-client attempts the UI should normally prevent) renders through `ConflictErrorBanner` |
| Import (`/import`) | Step 1 gains a required **target client** select. Every rule/group created in Step 3 is created under that client. Review table shows it in the header; changing it after parsing resets queued results |

### Carried over unchanged

Group "Active" toggle remains removed; delete-group detach/delete dialog, plain
delete-rule confirm, detach requiring algorithm + params, `identifier_signature`
filter on Rules, algorithms read-only page, import being pure client-side
parsing plus existing single-resource calls.

## 6. One-time secret handling (`SecretRevealDialog`)

Used after **create client** and **add secret**. Requirements:

- Shows the plaintext secret in a read-only field with a Copy button and a clear
  "This is the only time you'll see this secret" notice.
- The dialog cannot be dismissed by backdrop click or Escape. It closes only after
  the user ticks "I have copied this secret" and clicks Done.
- The secret must not enter the TanStack Query cache: run the mutation with
  `gcTime: 0`, pass the result to the dialog via local state, and call
  `mutation.reset()` on close. Never put it in the URL, router state, or logs.
- After close, nothing in the UI can retrieve it again; the secrets table only
  shows the hint.

## 7. Types and API contract updates

- `Rule` / `RuleGroup` response types: add `client_id: string`.
- Create bodies: `POST /rules` and `POST /groups` require `client_id` (slug).
- List query params: add `client_id`.
- New `Client` type: `client_id, name, description, status ('active'|'disabled'),
  scopes ('check'|'admin')[], created_at, updated_at`. New `ClientSecret` type:
  `id, secret_hint, created_at, expires_at, revoked_at`.
- Move-to-group and add-members request shapes are unchanged.
- Fetch the clients list once and cache it (`staleTime` of a few minutes) to
  resolve slugs to display names and to feed `ClientPicker`; do not fetch per row.

## 8. Ordered build phases

Each phase should be working and reviewable before the next starts. Backend
dependency noted per phase; phases A-B need backend Steps 5, 6 and 8.

- **A. Auth foundation.** `api/auth.ts`, `tokenStore`, `AuthProvider`,
  `RequireAuth`, `LoginPage`, bearer injection, single-flight refresh, 401
  refresh-retry, 403 handling, logout + cache clear. Guard every existing route.
  *Exit:* with a real admin client, login works, the existing Algorithms page
  loads with the token, an expired/garbled token bounces to login, and nothing
  sensitive is in any browser storage.
- **B. Clients feature.** `api/clients.ts`, `useClients`, list/create/detail/edit
  pages, `SecretRevealDialog`, Secrets panel, enable/disable with the
  self-lockout guard. *Exit:* create a client, see the secret once, add a second
  secret, hit the two-secret limit, revoke one, disable the client.
- **C. Client context + lists.** `ClientContext`, header switcher, `ClientBadge`,
  `ClientPicker`; add client column and filter to Rules and Groups lists, update
  query keys. *Exit:* switching client re-filters both lists; selection survives
  reload; lists never show another client's rows when one is selected.
- **D. Forms.** Client picker on Rule and Group create, read-only client on edit,
  `client_id` in create bodies, client on detail pages. *Exit:* same endpoint can
  be created under two different clients; duplicate within one client shows the
  409 banner.
- **E. Modals.** Same-client filtering in Move-to-Group, implicit client in Add
  Members, `ConflictErrorBanner` cross-client wording. *Exit:* a cross-client move
  can't be selected, and a forced 409 renders inline.
- **F. Import.** Target-client select in Step 1, applied to all creates, reset
  behavior on change, per-row results unchanged. *Exit:* import creates all rows
  under the chosen client; retry-failed-rows still works.
- **G. Packaging.** Update the Dockerfile/`entrypoint.sh` so nginx proxies
  `/api/*` to the backend (removes CORS), keep `public/config.js` runtime
  templating (`API_URL` may be relative), update `docker-compose.yml` to run the
  frontend against a backend with auth enabled and a bootstrapped admin client.
  *Exit:* full login -> manage clients -> manage rules flow works from the
  container with no CORS configuration on the backend.

## 9. Acceptance criteria

- No admin screen is reachable without a valid session; logout and session expiry
  both clear credentials, token, and the query cache.
- Credentials, tokens, and secrets exist only in JS memory: verified by inspecting
  localStorage, sessionStorage, cookies, IndexedDB, URLs, and console output
  after a full session.
- A plaintext client secret is displayed only inside `SecretRevealDialog`, only
  once, and is unrecoverable afterwards (including after closing the dialog and
  reopening the client page).
- Concurrent requests during a token expiry trigger exactly one token request.
- A 401 triggers one refresh-and-retry, then a clean redirect to login; a 403 never
  retries and never shows a generic toast.
- Rules and groups are always shown and created within an explicit client; a rule
  or group's client cannot be changed from the UI; Move-to-Group and Add Members
  can never offer a cross-client target.
- Disabling the currently logged-in client requires an extra confirmation.
- The Import flow still makes zero assumptions about a bulk-import backend
  endpoint, and creates everything under exactly one chosen client.
- No raw identifier value, client secret, or token is rendered anywhere (Redis
  scope still shows `algorithm:signature` only).
- `API_URL` remains runtime-configurable; rebuilding is never required to repoint
  the frontend.

## 10. Unknowns to confirm (do not assume)

1. Whether the backend will add CORS handling or the nginx same-origin proxy is
   used (Decision 2).
2. Whether `GET /clients` and list endpoints are paginated the same way as rules
   (affects the cached clients fetch for `ClientPicker`).
3. Whether rules/groups list responses return only the `client_id` slug or also a
   display name (the plan assumes slug only, resolved via the cached clients list).
4. Exact shape of RFC 6749 error bodies from `/auth/token` (assumed
   `{error, error_description}`).
5. Whether any non-admin operator access is wanted soon; if so, Option C in
   Decision 1 becomes a prerequisite rather than a later swap.