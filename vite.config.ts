import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal config optimized for Figma Make
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    copyPublicDir: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'], // 明確包含 React
    exclude: [],
  },
  publicDir: 'public',
});