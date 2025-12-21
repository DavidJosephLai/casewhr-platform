import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    wasmErrorSuppressor(), // 必須在第一個
    react()
  ],
  publicDir: 'public', // 明確指定 public 文件夾
  build: {
    // 禁用 WASM 相關的優化
    target: 'esnext',
    outDir: 'dist'
  }
});
