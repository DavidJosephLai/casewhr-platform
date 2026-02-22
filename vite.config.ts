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
    include: [
      'react', 
      'react-dom',
      // 🔥 明確包含所有 Radix UI 組件以修復 screenreader-string 錯誤
      '@radix-ui/react-select',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slider',
      '@radix-ui/react-avatar',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-menubar',
      '@radix-ui/react-accordion',
      '@radix-ui/react-slot',
      '@radix-ui/react-aspect-ratio',
    ],
    exclude: [],
    force: true, // 🔥 強制重新構建依賴
  },
  publicDir: 'public',
  // 🔥 清除緩存
  cacheDir: '.vite',
  // 🔥 明確解析策略
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});