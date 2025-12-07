import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local Development Config (no base path)
export default defineConfig({
  plugins: [react()],
  // No base path for local development
})

