import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// Port 5174: the customer app (Expo web) uses 8081, the backend 3000, Vite's default 5173 is left free.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});
