import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  esbuild: {
    // Automatically strip console.log and debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));