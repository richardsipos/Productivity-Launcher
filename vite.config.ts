import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Works for GitHub Pages under https://<user>.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: './',
})
