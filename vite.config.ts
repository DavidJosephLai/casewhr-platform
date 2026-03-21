import { defineConfig } from 'vite';

// Pure esbuild config - no React plugin to avoid compatibility issues
export default defineConfig({
  plugins: [],
  esbuild: {
    jsx: 'automatic',
    jsxDev: false,
    loader: 'tsx',
    include: /\.(tsx?|jsx?)$/,
    exclude: [],
  },
  clearScreen: false,
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
  },
  publicDir: 'public',
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});