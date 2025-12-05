import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }) => {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

  return {
    plugins: [react(), tsconfigPaths()],
    server: {
      port: 5173,
      // Proxy all /api requests to backend during development
      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          // Rewrite is optional — keep path as-is
        },
      },
    },
    define: {
      // expose env var safely if you need in code
      'process.env': {},
    },
  };
});
