# Rate Limiter Admin UI — Build Plan

Sep 27, 2026 · @Anushree M

Plan for a coding agent building the React + Vite admin frontend for the distributed rate limiter service. Reference: the user's own hand-drawn mockup image (attach alongside this doc) plus `prd_architecture.md` and the Phase 5 composite-identifiers/groups plan for the backend contract.

## 1. Corrections to the reference mockup

The user is attaching a hand-drawn mockup image alongside this doc. Build against it with these fixes:

1. **Remove the "Active" toggle from Group Create/Edit.** `rule_groups` has no `is_active` column in the backend schema — only member *rules* have `is_active`. Groups themselves cannot be activated/deactivated.
2. **Add a delete-confirmation dialog for "Delete Group"** with a required choice between `detach` (default, radio pre-selected) and `delete` for what happens to member rules, matching `DELETE /api/v1/groups/{id}?members=detach|delete`. Do not delete on a single click.
3. **Add a plain confirm dialog for "Delete Rule"** (irreversible, no undo in the API).
4. **Reuse the inline conflict-error banner** (shown correctly in the Add Members modal) in the **Move-to-Group modal** too — that action can also return a 409 on an endpoint+signature collision at the target group, and it should render the same way, not as a generic toast.
5. **Clarify routing for the grouped Rule Detail page's "Edit" button:** it must open the same grouped-locked edit form shown in "Rule – Create/Edit (Grouped rule – read-only fields)" — algorithm/identifier-types/priority read-only, only Overrides editable — never the plain create form.
6. **Add an `identifier_signature` filter to the Rules list page** (the mockup already has this on the Groups list; Rules should match).

## 2. Tech stack and project structure

**Stack:** React + Vite + TypeScript · TanStack Query (server state, caching, mutations) · React Router · React Hook Form + Zod (forms/validation) · Tailwind + shadcn/ui (components). No TanStack Table for v1 — resource lists are small (tens of rows); hand-roll simple client-side sort/filter/paginate and only reach for a table library later if that becomes a real pain point.

```
admin-frontend/
  src/
    api/
      client.ts            # fetch wrapper, reads runtime API_URL from window.__CONFIG__
      rules.ts              # getRules, getRule, createRule, updateRule, deleteRule, detachRule, moveToGroup
      groups.ts              # getGroups, getGroup, createGroup, patchGroup, addMembers, deleteGroup
      algorithms.ts
      importSpec.ts          # parseOpenApi, parsePostmanCollection (client-side only, no backend call)
    queries/
      useRules.ts             # useQuery/useMutation hooks wrapping api/rules.ts
      useGroups.ts
      useAlgorithms.ts
    routes/
      rules/                   # RulesListPage, RuleCreatePage, RuleEditPage, RuleDetailPage
      groups/                  # GroupsListPage, GroupCreatePage, GroupEditPage, GroupDetailPage
      algorithms/              # AlgorithmsListPage
      import/                  # ImportUploadPage, ImportReviewPage
    components/
      DataTable.tsx             # generic reusable table wrapper (sort/filter/paginate, hand-rolled)
      ConfirmDialog.tsx         # generic yes/no confirm, reused for rule delete
      forms/
        AlgorithmParamsFields.tsx    # swaps param inputs by selected algorithm
        IdentifierTypesPicker.tsx    # multi-select, max 3, global-alone rule
        EffectiveParamsPreview.tsx   # read-only merged base+overrides display
        ConflictErrorBanner.tsx      # inline 409 / per-row conflict display
    config.ts                   # reads window.__CONFIG__.API_URL
  public/config.js               # placeholder, templated at container start
  Dockerfile
  entrypoint.sh
```

**Runtime config, not build-time:** the API base URL must not be baked in at `vite build`. `public/config.js` ships as `window.__CONFIG__ = { API_URL: "__API_URL__" }`, loaded via `<script src="/config.js">` before the app bundle in `index.html`. The Docker entrypoint does a template substitution of `__API_URL__` with the real `$API_URL` env var at container start, so one Docker Hub image works against any user's backend.

## 3. Screens and routes

Sidebar: Rules · Groups · Algorithms · Import. Build against the attached mockup with the Section 1 corrections applied.

| Route | Screen | Notes |
| --- | --- | --- |
| `/rules` | Rules list | Table + endpoint/identifier\_signature/algorithm/active/grouped filters (correction 6); row actions: Edit, Activate/Deactivate, Delete (confirm dialog), Detach (grouped rows only) |
| `/rules/new` | Rule create | Full form, algorithm-conditional params, identifier types picker |
| `/rules/:id/edit` | Rule edit | Same form; if `group_id` set, algorithm/types/priority render read-only, only Overrides editable (correction 5) |
| `/rules/:id` | Rule detail | Read-only summary + effective params + Redis scope (`algorithm:signature` only, never the raw identifier value or digest) + Group Actions (Move to Group, Detach) |
| `/groups` | Groups list | Table + name/algorithm/identifier-type filters; row actions Edit, Delete (detach/delete choice, correction 2) |
| `/groups/new` | Group create | Base params form + optional initial members sub-table (endpoint + optional overrides per row) |
| `/groups/:id/edit` | Group edit | Edit name/description/base params/priority — no Active toggle (correction 1) |
| `/groups/:id` | Group detail | Base params, members table (endpoint, overrides badge, effective params, active, per-row Edit overrides / Detach), Add Members button, Delete Group button |
| `/algorithms` | Algorithms list | Read-only reference: name, description, param schema — no create/edit |
| `/import` | Import upload | Step 1 of the import flow, see Section 4 |
| `/import/review` | Import review | Step 2 of the import flow, see Section 4 |

**Modals (not routes):** Detach modal (algorithm + params required), Move-to-Group modal (target group + optional overrides + effective-params preview + conflict banner), Add Members modal (repeatable endpoint+overrides rows, all-or-nothing submit, per-row conflict banner), Delete Group confirm (detach/delete radio), Delete Rule confirm (plain).

## 4. Import from Postman collection / OpenAPI spec

**Important constraint for the coding agent: there is no bulk-import backend endpoint.** This is a pure frontend feature that parses an uploaded file client-side, then orchestrates a sequence of ordinary calls to the existing single-resource endpoints (`POST /api/v1/rules`, `POST /api/v1/groups`, `POST /api/v1/groups/{id}/members`). Do not design or assume a new backend route.

### Step 1 — Upload (`/import`)

- File input accepting `.json` (Postman Collection v2.1, or OpenAPI 3.x JSON) and `.yaml`/`.yml` (OpenAPI 3.x YAML).
- Detect format: OpenAPI has a top-level `openapi` or `swagger` key; Postman has `info.schema` containing `"collection"`. Reject anything else with a clear error, no silent fallback.
- Parse client-side only — nothing is uploaded to the backend at this step.
  - **OpenAPI:** walk `paths`; each `path` × method under it (`get`/`post`/etc., excluding `parameters`/`$ref` keys) becomes one candidate endpoint. Use `tags[0]` (if present) as a suggested group name; `summary`/`operationId` as a display label only.
  - **Postman:** recursively walk `item[]`. An item with a nested `item[]` is a folder → suggested group name = folder name. A leaf item has `request.method` and `request.url` (use `.raw` or rebuild from `.path`/`.host`) → one candidate endpoint. Strip the collection's `{{baseUrl}}`-style variable prefix, keep the path only.
  - **Path template normalization is a decision point, not an assumption:** confirm with the user how the backend's `rules.endpoint` field expects path parameters written (literal path vs `{id}`-style templates vs Postman's `:id`-style) before finalizing the normalizer — flag this in code as a single well-named function (`normalizeEndpointPath`) so the convention is easy to change in one place if the assumption is wrong.
- Use a lightweight parser only: manual JSON/YAML traversal (`js-yaml` for the YAML case) — do not pull in a full OpenAPI validator/dereferencer (e.g. `swagger-parser`); this feature only needs path, method, and grouping hints, not schema validation.

### Step 2 — Review and group (`/import/review`)

- Table of parsed candidate endpoints: checkbox, method, path, suggested group (editable), a status column (`unassigned` / `standalone` / `→ group name`).
- Bulk actions on the current selection:
  - **Group selected** → opens the existing Group Create form (Section 3) pre-filled with the selected endpoints as initial members (same sub-table already designed for manual group creation).
  - **Create as standalone rules** → opens a bulk-params panel (algorithm + identifier types + base params applied to every selected endpoint at once, still using the same `AlgorithmParamsFields`/`IdentifierTypesPicker` components), then queues one `POST /api/v1/rules` per endpoint.
  - **Skip** → excluded from creation entirely.
- Endpoints suggested into the same group (same tag/folder) are pre-checked together as a starting point, but every grouping is editable before submit — the suggestion is a default, never enforced.

### Step 3 — Submit and per-row results

- Execute the queued creates in sequence (not all-parallel, to avoid tripping the backend's own uniqueness checks against each other mid-batch), showing a per-row status: pending → success / 409 conflict / other error.
- A 409 on one row must not abort the rest of the batch — continue, then show a final summary (created N, conflicted M, failed K) with the ability to retry just the failed/conflicted rows without re-submitting the ones that already succeeded.
- Reuse `ConflictErrorBanner` (Section 5) for row-level 409 display, consistent with Add Members and Move-to-Group.

## 5. Shared components (build once, reuse everywhere)

| Component | Used in |
| --- | --- |
| `AlgorithmParamsFields` | Rule create/edit, Group create/edit, Import bulk-params panel |
| `IdentifierTypesPicker` | Rule create/edit, Group create/edit, Import bulk-params panel |
| `EffectiveParamsPreview` | Grouped rule edit, Group detail member rows, Move-to-Group modal |
| `ConflictErrorBanner` | Add Members modal, Move-to-Group modal, Import review/submit |
| `ConfirmDialog` | Delete Rule, and as the base for the Delete Group detach/delete choice |
| `DataTable` | Rules list, Groups list, Algorithms list, Import review table |

Build these before any resource-specific screen — every list/create/edit page depends on at least one.

## 6. Ordered build phases

Each phase should be working and reviewable before the next starts.

1. **Scaffold** — Vite + TS + Tailwind + shadcn/ui init; `api/client.ts` + `config.ts` reading `window.__CONFIG__.API_URL`; React Router shell with the sidebar nav (Rules / Groups / Algorithms / Import).
2. **Shared components** (Section 5) — build all six before any resource screen.
3. **Algorithms list** (read-only) — simplest resource end-to-end, proves the `DataTable` + TanStack Query pattern.
4. **Rules** — list (with filters, correction 6) → create → edit (including the grouped-locked variant, correction 5) → detail → delete confirm.
5. **Groups** — list → create (with initial members) → edit (no Active toggle, correction 1) → detail (members table, Add Members modal) → delete (detach/delete choice, correction 2).
6. **Detach modal** and **Move-to-Group modal** (with the reused conflict banner, correction 4) — wired to the Rule detail page's Group Actions.
7. **Import feature** (Section 4) — upload → parse → review/group → bulk submit with per-row results.
8. **Docker packaging** — multi-stage Dockerfile, `entrypoint.sh` templating `public/config.js`, `docker-compose.yml` wiring the frontend to a backend container for local testing.

## 7. Acceptance criteria

- All screens in Section 3 match the attached mockup with the six Section 1 corrections applied — no Active toggle on groups, both delete confirms present, conflict banner reused on Move-to-Group, correct routing on grouped Rule Detail's Edit, identifier\_signature filter on Rules.
- Grouped rules cannot have algorithm/identifier\_types/priority edited from the UI — only Overrides, matching the backend's 409 guard.
- Detach requires both algorithm and params (never optional).
- Add Members and the Import submit step are both all-or-nothing-safe: a conflict on one row never silently drops or corrupts another row's state, and partial failure is visible and retryable.
- The import flow makes zero assumptions about a bulk-import backend endpoint — it is entirely client-side parsing plus a sequence of existing single-resource API calls.
- No raw identifier value is ever rendered in the UI (Redis Scope shows `algorithm:signature` only).
- `API_URL` is injected at container start via `entrypoint.sh` templating `public/config.js` — rebuilding the frontend is never required to point it at a different backend.