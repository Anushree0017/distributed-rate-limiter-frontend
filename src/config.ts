declare global {
  interface Window {
    __CONFIG__?: { API_URL?: string }
  }
}

const PLACEHOLDER = '__API_URL__'

// public/config.js ships with API_URL = "__API_URL__"; entrypoint.sh
// template-substitutes it with the real backend URL at container start (see
// Dockerfile). Until that substitution has happened — local `npm run dev`,
// or a `vite preview` off the raw build — fall back to a same-origin
// relative path so requests go through the Vite dev proxy (or a reverse
// proxy in front of both services) instead of literally requesting
// "__API_URL__/rules".
const configured = window.__CONFIG__?.API_URL
export const API_URL = configured && configured !== PLACEHOLDER ? configured : '/api/v1'
