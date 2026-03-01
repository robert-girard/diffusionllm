import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'project-name' with your actual GitLab project slug
  // This ensures assets like CSS/JS load correctly on gitlab.io/project-name/
  base: './', 
  build: {
    outDir: 'dist',
  }
})