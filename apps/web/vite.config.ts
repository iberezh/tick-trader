import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173 },
  // react-grid-layout / react-draggable read process.env.NODE_ENV at runtime; Vite
  // doesn't define `process` in the browser, so replace it (otherwise drag/resize throw).
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  build: {
    // ECharts (already tree-shaken to the pieces we register) is ~210kB gzipped on its own —
    // that's the floor for a charting lib, so don't warn about its isolated chunk.
    chunkSizeWarningLimit: 700,
    // Split the heavy, rarely-changing deps into their own chunks so ECharts (the bulk of the
    // bundle) is cached separately from app code and doesn't block first paint of the landing.
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}));
