import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  publicDir: 'public',
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@utils': path.resolve(__dirname, './utils'),
      '@lib': path.resolve(__dirname, './lib'),
      '@contexts': path.resolve(__dirname, './contexts'),
      '@hooks': path.resolve(__dirname, './hooks'),
    },
  },
  
  build: {
    target: 'esnext',
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: [
        // ✅ 排除 Supabase Edge Functions（使用 Deno 語法，不應由 Vite 構建）
        /^\/supabase\//,
      ],
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  
  // ✅ 排除 Supabase 後端文件
  server: {
    hmr: {
      overlay: false
    },
    watch: {
      ignored: ['**/supabase/**', '**/node_modules/**']
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
    exclude: [
      '/supabase/**',
    ],
    esbuildOptions: {
      target: 'esnext',
      logLevel: 'error', // 只顯示錯誤，忽略警告
    },
  },
  
  // ✅ 添加 esbuild 配置以处理依赖
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    jsx: 'automatic',
  },
});