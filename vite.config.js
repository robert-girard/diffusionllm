import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: https://robert-girard.github.io/diffusionllm/
  base: '/diffusionllm/',
  build: {
    outDir: 'dist',
  }
})