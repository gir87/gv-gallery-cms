import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' is crucial for shared hosting. 
  // It ensures assets are loaded relatively (e.g. "assets/script.js" instead of "/assets/script.js")
  base: './', 
  server: {
    // Proxy API requests during development to avoid CORS issues if running PHP locally
    proxy: {
      '/api.php': 'http://localhost:8000' 
    }
  }
})