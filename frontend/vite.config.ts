import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            if (res && 'writeHead' in res && !(res as any).headersSent) {
              (res as any).writeHead(503, { 'Content-Type': 'application/json' });
              (res as any).end(
                JSON.stringify({
                  error: {
                    message:
                      'Backend service is not running on port 5000. Please start the Flask backend server.',
                    code: 'BACKEND_OFFLINE',
                    details: { message: err.message },
                  },
                })
              );
            }
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
