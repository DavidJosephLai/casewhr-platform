import { defineConfig } from 'vite';

// Minimal config without @vitejs/plugin-react to avoid compatibility issues
export default defineConfig({
  plugins: [],
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
        '.jsx': 'jsx',
        '.tsx': 'tsx',
      },
    },
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