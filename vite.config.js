import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['bcryptjs', 'jose'],
    exclude: ['jsonwebtoken']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
