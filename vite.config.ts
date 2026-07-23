import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://<user>.github.io/league-table-visualizer/, so every asset
// (including the static data JSON under public/data) resolves under this base.
export default defineConfig({
  base: '/league-table-visualizer/',
  plugins: [react(), tailwindcss()],
})
