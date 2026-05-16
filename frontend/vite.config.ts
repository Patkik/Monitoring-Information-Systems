import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config to:
// 1) Silence benign Rollup warnings caused by "use client" directives in some libraries
// 2) Improve chunking to reduce the main bundle size warning
// 3) Relax the chunk-size warning threshold a bit for DX
//
// VITE_BASE_PATH: set to "/steb/" when building for the shared-server deployment
// so that all asset URLs are rooted at the sub-path. Defaults to "/" for local dev.
const basePath = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  base: basePath,
  define: {
    // Expose Vite's env for modules that can't directly reference import.meta.env in Jest tests
    importMetaEnv: 'import.meta.env',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        const msg = typeof warning.message === 'string' ? warning.message : '';
        // Silence noisy "Module level directives cause errors when bundled" warnings for "use client"
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          msg.includes('Module level directives cause errors when bundled') && msg.includes('"use client"')
        ) {
          return; // ignore
        }
        warn(warning);
      },
      output: {
        // Dynamic chunk strategy: if not matched by explicit groups below, keep default behavior.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/')) return 'react-vendor';
            if (id.includes('react-dom')) return 'react-vendor';
            if (id.includes('react-router')) return 'react-vendor';
            if (id.includes('@tanstack/react-query')) return 'tanstack';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('chart.js') || id.includes('d3')) return 'charts';
          }
        },
      },
    },
    // Raise the default 500 kB warning threshold modestly
    chunkSizeWarningLimit: 1024,
  },
});
