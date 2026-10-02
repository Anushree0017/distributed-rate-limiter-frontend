import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Dev-only convenience: proxies API calls to the backend so the browser
    // never has to make a cross-origin request (the backend has no CORS
    // middleware). Production points window.__CONFIG__.API_URL directly at
    // the backend instead — see public/config.js and entrypoint.sh.
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
