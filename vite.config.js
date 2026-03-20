import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Generic proxy: any direct LM Studio IP request is proxied through Vite to bypass CORS
      // Mac (default)
      '/api': {
        target: 'http://192.168.1.233:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1')
      },
      // PC (local network)
      '/api-pc': {
        target: 'http://169.254.83.107:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-pc/, '/v1')
      },
      // Tailscale PC
      '/api-tailscale': {
        target: 'http://100.87.53.100:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-tailscale/, '/v1')
      },
      // Local machine (same PC as dev server)
      '/api-local': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-local/, '/v1')
      },
      // Default IP from config.js
      '/api-default': {
        target: 'http://192.168.86.28:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-default/, '/v1')
      },
      // Default SD IP from config.js
      '/api-sd-default': {
        target: 'http://192.168.86.28:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-sd-default/, '/')
      }
    }
  }
})
