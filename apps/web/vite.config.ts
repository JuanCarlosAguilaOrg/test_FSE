import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// El navegador llama a /api (mismo origen); Vite lo reenvía a la API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000', changeOrigin: true } },
  },
});
