import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal config optimized for Figma Make
export default defineConfig({
  plugins: [
    react({
      // 🔥 使用經典 JSX runtime 避免內部依賴問題
      jsxRuntime: 'classic',
    })
  ],
  clearScreen: false,
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
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
  },
  publicDir: 'public',
  cacheDir: '.vite',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});