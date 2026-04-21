import react from '@vitejs/plugin-react';
import vike from 'vike/plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    vike(),
  ],
  server: {
    https: false, // Disable HTTPS for now
    port: 3000,
  },
});