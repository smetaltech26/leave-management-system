import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/leave-management-system/',
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react', '@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/line-api': {
        target: 'https://api.line.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/line-api/, '')
      }
    }
  }
});
