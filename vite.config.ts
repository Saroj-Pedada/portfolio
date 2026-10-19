import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // served from https://saroj-pedada.github.io/portfolio/
  base: '/portfolio/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 },
})
