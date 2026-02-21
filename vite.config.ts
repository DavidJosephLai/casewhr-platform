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
    sourcemap: true, // 啟用 sourcemap 幫助調試
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
    force: true, // 🔥 強制重新構建依賴
  },
  publicDir: 'public',
  // 🔥 清除緩存
  cacheDir: '.vite',
});