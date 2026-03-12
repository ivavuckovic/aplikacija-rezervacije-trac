import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/components'),
      '@pages':      resolve(__dirname, 'src/pages'),
      '@services':   resolve(__dirname, 'src/services'),
      '@store':      resolve(__dirname, 'src/store'),
      '@types':      resolve(__dirname, 'src/types'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@utils':      resolve(__dirname, 'src/utils'),
    },
  },

  server: {
    port: 3001,
    proxy: {
      '/api': {
        target:       'http://localhost:4001',
        changeOrigin: true,
        secure:       false,
      },
    },
  },

  build: {
    outDir:    'dist',
    sourcemap: true,
  },

  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'http://localhost:4001/api'
    ),
  },
});
