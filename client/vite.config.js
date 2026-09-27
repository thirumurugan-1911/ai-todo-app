import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // All /api requests go to the Express backend — no CORS issues, no keys in the frontend.
    // Override the target with VITE_API_URL if your backend runs elsewhere.
    proxy: { '/api': process.env.VITE_API_URL || 'http://localhost:5000' },
  },
})
