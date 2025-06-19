import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  server: {
    port: 3000, // Change this if you want a different dev server port
    proxy: {
    '/api': 'http://localhost:3002'
    
  },
  watch: {
      ignored: ['Backend\server-log.txt']
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
 

})    