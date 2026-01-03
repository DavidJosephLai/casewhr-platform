import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  publicDir: 'public',
  
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.tsx', '.json', '.jsx'],
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
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'vendor': ['lucide-react', '@supabase/supabase-js']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    minify: 'esbuild', // ✅ 改用 esbuild，更快且更穩定
    sourcemap: false,
  },
  
  server: {
    hmr: {
      overlay: false
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
  },
});