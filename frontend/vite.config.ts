import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      headers: {
        // Allow Google's GIS popup to communicate with the opener window.
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8020',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})

