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
      }
    }
  }
})
