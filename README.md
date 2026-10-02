# Rate Limiter Admin UI

React + Vite + TypeScript admin frontend for the distributed rate limiter service (`../backend`). Manages rules, rule
groups, and a client-side spec-import flow against the backend's `/api/v1/rules`, `/api/v1/groups`, and
`/api/v1/algorithms` endpoints. See `.claude/plans/drl-frontend-build-plan.md` for the full design.

## Stack

React Router · TanStack Query · React Hook Form + Zod · Tailwind + a small hand-rolled shadcn-style component set ·
`js-yaml` for the OpenAPI-YAML import case.

## Local development

```bash
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:8000` (the backend has no CORS middleware, so this avoids
cross-origin requests in the browser). Override the proxy target with `VITE_BACKEND_URL`.

## Runtime configuration

The API base URL is **not** baked in at build time. `public/config.js` ships as
`window.__CONFIG__ = { API_URL: "__API_URL__" }`; `entrypoint.sh` substitutes the real URL at container start (see
`Dockerfile`). Locally (outside Docker), `src/config.ts` falls back to the relative path `/api/v1` so the dev proxy —
or a same-origin reverse proxy in front of both services — still works without any templating step.

## Docker

```bash
docker build -t drl-admin-frontend .
docker run -p 8080:80 -e API_URL=https://your-backend/api/v1 drl-admin-frontend
```

`docker-compose.yml` runs the frontend alone (the backend has no Dockerfile of its own by explicit project decision —
see its CLAUDE.md — so run it however you normally do and point `API_URL` at it). Cross-origin `API_URL` needs CORS
enabled on the backend, or both services behind one reverse-proxy origin.
