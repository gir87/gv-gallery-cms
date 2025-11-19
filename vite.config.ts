import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' ensures relative paths for assets (crucial for shared hosting)
  base: './', 
  build: {
    // Flatten the output directory so JS/CSS are next to index.html
    assetsDir: '', 
  },
  server: {
    // Proxy API requests during development
    proxy: {
      '/api.php': 'http://localhost:8000' 
    }
  }
})