import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: [
        '**/public/**', 
        '**/scripts/**', 
        '**/temp/**', 
        '**/nexus/**', 
        '**/*.log', 
        '**/aura_data.db*'
      ]
    },
    hmr: {
      overlay: false
    },
    proxy: {
      '/api-ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-ollama/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.removeHeader('Origin');
          });
        }
      },
      // Generic proxy: any direct LM Studio IP request is proxied through Vite to bypass CORS
      // Mac (default)
      '/api-mac': {
        target: 'http://192.168.1.233:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-mac/, '/v1')
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
