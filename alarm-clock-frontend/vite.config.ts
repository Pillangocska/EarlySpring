import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to Spring Boot backend
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Proxy OAuth2 requests to Spring Boot backend
      '/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Proxy login success and logout requests
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
    }
  }
})
