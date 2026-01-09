import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal config optimized for Figma Make
export default defineConfig({
  plugins: [react()],
  clearScreen: false, // 防止 clearScreen undefined 錯誤
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined, // 避免 chunk 分割問題
      },
    },
  },
  optimizeDeps: {
    exclude: [], // 不排除任何依賴
  },
});