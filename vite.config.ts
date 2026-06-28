import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist/index.mjs'),
    },
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
    force: true,
  },
})
