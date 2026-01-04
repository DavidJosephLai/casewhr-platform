import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Absolute minimal config - let Figma Make handle everything
export default defineConfig({
  plugins: [react()],
});
